package lsy.toy.backend.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.KakaoReadyResponse;
import lsy.toy.backend.Dto.OrderPreview;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Entity.KakaoPendingPayment;
import lsy.toy.backend.Entity.PendingPaymentStatus;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.KakaoPendingPaymentRepository;
import lsy.toy.backend.Repository.UserRepository;
import lsy.toy.backend.Security.SystemAuthentication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// 💡 카카오페이 결제 준비(ready)/승인(approve) 연동. 실제 orders row는 승인이 성공한 뒤에야
// OrderService.createOrderFromCart로 만든다 - ready 시점엔 아직 결제가 되지 않았으므로
// KakaoPendingPayment에 요청 내용을 임시로 들고 있다가 승인 시 그대로 재사용한다.
//
// 승인(PG 호출)과 주문 생성(DB 쓰기)은 하나의 트랜잭션으로 묶지 않는다. PG 승인은 이미
// 고객에게 돈을 청구하는 되돌릴 수 없는 외부 작업이라, 그 뒤에 이어지는 주문 생성이 실패해도
// PG 승인 자체를 롤백할 수는 없기 때문이다. 대신 PG 승인 성공 직후 pending 상태를 APPROVED로
// 즉시 커밋해 "결제는 됐지만 주문이 없다"는 사실을 DB에 남기고, reconcileStuckPayments()가
// 그 상태를 찾아 재시도하거나 최종적으로 PG 결제를 취소(환불)한다.
@Service
public class KakaoPayService {

    private static final Logger log = LoggerFactory.getLogger(KakaoPayService.class);
    private static final String KAKAO_BASE_URL = "https://open-api.kakaopay.com";

    private static final int MAX_RETRY_ATTEMPTS = 5;
    private static final Duration RETRY_GRACE_PERIOD = Duration.ofMinutes(2);
    private static final Duration GIVE_UP_AFTER = Duration.ofHours(24);

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper;
    private final KakaoPendingPaymentRepository pendingRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final TransactionTemplate transactionTemplate;
    private final String secretKey;
    private final String cid;
    private final String frontendUrl;

    public KakaoPayService(
        @Value("${kakaopay.secret-key}") String secretKey,
        @Value("${kakaopay.cid}") String cid,
        @Value("${app.frontend-url}") String frontendUrl,
        ObjectMapper objectMapper,
        KakaoPendingPaymentRepository pendingRepository,
        UserRepository userRepository,
        OrderService orderService,
        PlatformTransactionManager transactionManager
    ) {
        this.secretKey = secretKey;
        this.cid = cid;
        this.frontendUrl = frontendUrl;
        this.objectMapper = objectMapper;
        this.pendingRepository = pendingRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public KakaoReadyResponse ready(String email, CreateOrderRequest request) {
        OrderPreview preview = orderService.previewOrder(email, request);
        User user = findUser(email);

        String partnerOrderId = "order-" + UUID.randomUUID();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cid", cid);
        body.put("partner_order_id", partnerOrderId);
        body.put("partner_user_id", email);
        body.put("item_name", preview.getItemName());
        body.put("quantity", preview.getQuantity());
        body.put("total_amount", preview.getTotalPrice());
        body.put("tax_free_amount", 0);
        body.put("approval_url", frontendUrl + "/checkout/kakao/approve?orderId=" + partnerOrderId);
        body.put("cancel_url", frontendUrl + "/checkout/kakao/cancel");
        body.put("fail_url", frontendUrl + "/checkout/kakao/fail");

        JsonNode response = callKakao("/online/v1/payment/ready", body, "결제 준비");
        String tid = response.get("tid").asText();
        String redirectUrl = response.get("next_redirect_pc_url").asText();

        pendingRepository.save(
            new KakaoPendingPayment(tid, partnerOrderId, user.getId(), serialize(request), preview.getTotalPrice())
        );

        return new KakaoReadyResponse(redirectUrl);
    }

    public OrderResponse approve(String email, String partnerOrderId, String pgToken) {
        KakaoPendingPayment pending = pendingRepository.findByPartnerOrderId(partnerOrderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 요청을 찾을 수 없습니다."));

        User user = findUser(email);
        if (!pending.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 결제 요청만 승인할 수 있습니다.");
        }

        if (pending.getStatus() == PendingPaymentStatus.READY) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("cid", cid);
            body.put("tid", pending.getTid());
            body.put("partner_order_id", pending.getPartnerOrderId());
            body.put("partner_user_id", email);
            body.put("pg_token", pgToken);
            callKakao("/online/v1/payment/approve", body, "결제 승인");

            markApproved(pending.getId());
        }

        return completePendingOrder(pending.getId(), email);
    }

    private void markApproved(Long pendingId) {
        transactionTemplate.executeWithoutResult(status -> {
            KakaoPendingPayment pending = pendingRepository.findById(pendingId)
                .orElseThrow(() -> new IllegalStateException("pending payment missing: " + pendingId));
            pending.markApproved();
            pendingRepository.save(pending);
        });
    }

    // 💡 승인 이후 단계(주문 생성 + pending 삭제)만 묶은 트랜잭션. approve()에서 최초 1회,
    // 이 단계에서 실패하면 사용자의 재시도(approve 재호출, 이때는 PG를 다시 호출하지 않는다)나
    // reconcileStuckPayments() 배치가 같은 pendingId로 다시 호출해 재시도한다.
    private OrderResponse completePendingOrder(Long pendingId, String email) {
        return transactionTemplate.execute(status -> {
            KakaoPendingPayment pending = pendingRepository.findById(pendingId)
                .orElseThrow(() -> new IllegalStateException("pending payment missing: " + pendingId));
            CreateOrderRequest orderRequest = deserialize(pending.getRequestPayload());
            OrderResponse response = orderService.createOrderFromCart(email, orderRequest);
            pendingRepository.delete(pending);
            return response;
        });
    }

    // 💡 "PG 승인은 됐지만 주문 생성이 끝나지 않은 채 방치된" pending을 찾아 재시도하고,
    // 계속 실패하면 PG 결제를 취소해 실제로 환불한다. RLS 정책이 요청 스레드의
    // SecurityContext에 의존하므로, 배치 스레드에는 SystemAuthentication으로 관리자 권한을
    // 임시로 채워 넣어야 pending/orders/users 테이블에 접근할 수 있다.
    @Scheduled(fixedDelay = 300_000, initialDelay = 60_000)
    public void reconcileStuckPayments() {
        SystemAuthentication.runAsAdmin(() -> {
            Instant threshold = Instant.now().minus(RETRY_GRACE_PERIOD);
            List<KakaoPendingPayment> stuck =
                pendingRepository.findByStatusAndApprovedAtBefore(PendingPaymentStatus.APPROVED, threshold);
            for (KakaoPendingPayment pending : stuck) {
                reconcileOne(pending);
            }
        });
    }

    private void reconcileOne(KakaoPendingPayment pending) {
        try {
            User user = userRepository.findById(pending.getUserId())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없음: " + pending.getUserId()));
            completePendingOrder(pending.getId(), user.getEmail());
            log.info("카카오페이 정합성 배치: 지연 주문 생성 성공. partnerOrderId={}", pending.getPartnerOrderId());
        } catch (Exception e) {
            log.warn(
                "카카오페이 정합성 배치: 주문 생성 재시도 실패. partnerOrderId={}, retryCount={}",
                pending.getPartnerOrderId(), pending.getRetryCount() + 1, e
            );
            if (recordFailureAndCheckGiveUp(pending.getId(), e)) {
                cancelAndDrop(pending);
            }
        }
    }

    private boolean recordFailureAndCheckGiveUp(Long pendingId, Exception error) {
        return Boolean.TRUE.equals(transactionTemplate.execute(status -> {
            KakaoPendingPayment fresh = pendingRepository.findById(pendingId).orElse(null);
            if (fresh == null) {
                return false;
            }
            fresh.recordRetryFailure(error.getMessage());
            pendingRepository.save(fresh);
            boolean expired = fresh.getApprovedAt() != null
                && fresh.getApprovedAt().isBefore(Instant.now().minus(GIVE_UP_AFTER));
            return fresh.getRetryCount() >= MAX_RETRY_ATTEMPTS || expired;
        }));
    }

    // 💡 재시도를 포기하고 실제로 PG 결제를 취소(환불)한다. 취소 API마저 실패하면 pending을
    // 남겨 두어 다음 배치 주기에 다시 시도하고, 매번 log.error로 수동 확인이 필요함을 남긴다.
    private void cancelAndDrop(KakaoPendingPayment pending) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("cid", cid);
            body.put("tid", pending.getTid());
            body.put("cancel_amount", pending.getAmount());
            body.put("cancel_tax_free_amount", 0);
            callKakao("/online/v1/payment/cancel", body, "결제 취소(정합성 배치)");
        } catch (Exception cancelError) {
            log.error(
                "카카오페이 정합성 배치: 자동 환불 실패 - 수동 확인 필요. partnerOrderId={}, tid={}, amount={}",
                pending.getPartnerOrderId(), pending.getTid(), pending.getAmount(), cancelError
            );
            return;
        }

        log.error(
            "카카오페이 정합성 배치: 주문 생성이 계속 실패해 PG 승인을 자동 취소함. partnerOrderId={}, tid={}, amount={}",
            pending.getPartnerOrderId(), pending.getTid(), pending.getAmount()
        );
        transactionTemplate.executeWithoutResult(status ->
            pendingRepository.findById(pending.getId()).ifPresent(pendingRepository::delete));
    }

    private JsonNode callKakao(String path, Map<String, Object> body, String actionLabel) {
        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(KAKAO_BASE_URL + path))
                .header("Authorization", "SECRET_KEY " + secretKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.warn("카카오페이 {} 실패: status={}, body={}", actionLabel, response.statusCode(), response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "카카오페이 " + actionLabel + "에 실패했습니다.");
            }
            return objectMapper.readTree(response.body());
        } catch (IOException | InterruptedException e) {
            log.error("카카오페이 {} 중 오류", actionLabel, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "카카오페이 " + actionLabel + " 중 오류가 발생했습니다.");
        }
    }

    private String serialize(CreateOrderRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("결제 요청 정보를 직렬화할 수 없습니다.", e);
        }
    }

    private CreateOrderRequest deserialize(String payload) {
        try {
            return objectMapper.readValue(payload, CreateOrderRequest.class);
        } catch (IOException e) {
            throw new IllegalStateException("결제 요청 정보를 복원할 수 없습니다.", e);
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다: " + email));
    }
}
