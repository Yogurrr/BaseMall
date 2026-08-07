package lsy.toy.backend.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.KakaoReadyResponse;
import lsy.toy.backend.Dto.OrderPreview;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Entity.KakaoPendingPayment;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.KakaoPendingPaymentRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

// 💡 카카오페이 결제 준비(ready)/승인(approve) 연동. 실제 orders row는 승인이 성공한 뒤에야
// OrderService.createOrderFromCart로 만든다 - ready 시점엔 아직 결제가 되지 않았으므로
// KakaoPendingPayment에 요청 내용을 임시로 들고 있다가 승인 시 그대로 재사용한다.
@Service
public class KakaoPayService {

    private static final Logger log = LoggerFactory.getLogger(KakaoPayService.class);
    private static final String KAKAO_BASE_URL = "https://open-api.kakaopay.com";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper;
    private final KakaoPendingPaymentRepository pendingRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
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
        OrderService orderService
    ) {
        this.secretKey = secretKey;
        this.cid = cid;
        this.frontendUrl = frontendUrl;
        this.objectMapper = objectMapper;
        this.pendingRepository = pendingRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
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

        pendingRepository.save(new KakaoPendingPayment(tid, partnerOrderId, user.getId(), serialize(request)));

        return new KakaoReadyResponse(redirectUrl);
    }

    @Transactional
    public OrderResponse approve(String email, String partnerOrderId, String pgToken) {
        KakaoPendingPayment pending = pendingRepository.findByPartnerOrderId(partnerOrderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 요청을 찾을 수 없습니다."));

        User user = findUser(email);
        if (!pending.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 결제 요청만 승인할 수 있습니다.");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cid", cid);
        body.put("tid", pending.getTid());
        body.put("partner_order_id", pending.getPartnerOrderId());
        body.put("partner_user_id", email);
        body.put("pg_token", pgToken);
        callKakao("/online/v1/payment/approve", body, "결제 승인");

        CreateOrderRequest orderRequest = deserialize(pending.getRequestPayload());
        OrderResponse response = orderService.createOrderFromCart(email, orderRequest);
        pendingRepository.delete(pending);

        return response;
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
