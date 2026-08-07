package lsy.toy.backend.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.OrderPreview;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Dto.TossConfirmRequest;
import lsy.toy.backend.Dto.TossReadyResponse;
import lsy.toy.backend.Entity.TossPendingPayment;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.TossPendingPaymentRepository;
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
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

// 💡 토스페이먼츠 결제위젯 연동. 카카오페이와 동일하게, 실제 orders row는 승인이 성공한 뒤에야
// OrderService.createOrderFromCart로 만든다 - prepare 시점엔 아직 결제가 되지 않았으므로
// TossPendingPayment에 요청 내용과 청구 금액을 임시로 들고 있다가 승인 시 그대로 재사용한다.
@Service
public class TossPayService {

    private static final Logger log = LoggerFactory.getLogger(TossPayService.class);
    private static final String TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper;
    private final TossPendingPaymentRepository pendingRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final String secretKey;

    public TossPayService(
        @Value("${tosspayments.secret-key}") String secretKey,
        ObjectMapper objectMapper,
        TossPendingPaymentRepository pendingRepository,
        UserRepository userRepository,
        OrderService orderService
    ) {
        this.secretKey = secretKey;
        this.objectMapper = objectMapper;
        this.pendingRepository = pendingRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
    }

    public TossReadyResponse prepare(String email, CreateOrderRequest request) {
        OrderPreview preview = orderService.previewOrder(email, request);
        User user = findUser(email);

        String orderId = "order-" + UUID.randomUUID();
        pendingRepository.save(new TossPendingPayment(orderId, user.getId(), preview.getTotalPrice(), serialize(request)));

        return new TossReadyResponse(orderId, preview.getTotalPrice(), preview.getItemName());
    }

    @Transactional
    public OrderResponse confirm(String email, TossConfirmRequest request) {
        TossPendingPayment pending = pendingRepository.findByOrderId(request.getOrderId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 요청을 찾을 수 없습니다."));

        User user = findUser(email);
        if (!pending.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 결제 요청만 승인할 수 있습니다.");
        }

        // 💡 프론트가 위조한 금액으로 승인을 요청해도, 우리 서버가 prepare 시점에 계산해 저장해둔
        // 금액과 다르면 토스 승인 API를 아예 호출하지 않는다.
        if (pending.getAmount() != request.getAmount()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 금액이 일치하지 않습니다.");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("paymentKey", request.getPaymentKey());
        body.put("orderId", request.getOrderId());
        body.put("amount", request.getAmount());
        callTossConfirm(body);

        CreateOrderRequest orderRequest = deserialize(pending.getRequestPayload());
        OrderResponse response = orderService.createOrderFromCart(email, orderRequest);
        pendingRepository.delete(pending);

        return response;
    }

    private void callTossConfirm(Map<String, Object> body) {
        try {
            String credentials = Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(TOSS_CONFIRM_URL))
                .header("Authorization", "Basic " + credentials)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.warn("토스페이먼츠 결제 승인 실패: status={}, body={}", response.statusCode(), response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "토스페이먼츠 결제 승인에 실패했습니다.");
            }
        } catch (IOException | InterruptedException e) {
            log.error("토스페이먼츠 결제 승인 중 오류", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "토스페이먼츠 결제 승인 중 오류가 발생했습니다.");
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
