package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Dto.TossConfirmRequest;
import lsy.toy.backend.Dto.TossReadyResponse;
import lsy.toy.backend.Service.TossPayService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/toss")
@CrossOrigin(origins = "http://localhost:5173")
public class TossPaymentController {

    private final TossPayService tossPayService;

    public TossPaymentController(TossPayService tossPayService) {
        this.tossPayService = tossPayService;
    }

    // 1. 토스페이먼츠 결제 준비 - 장바구니 기준 금액을 계산해 결제위젯에 넣을 orderId/금액을 발급한다 (POST, JWT 필요)
    @PostMapping("/prepare")
    public TossReadyResponse prepare(Authentication authentication, @RequestBody CreateOrderRequest request) {
        return tossPayService.prepare(authentication.getName(), request);
    }

    // 2. 토스페이먼츠 결제 승인 - 결제위젯에서 돌아온 뒤 승인 처리하고 실제 주문을 생성한다 (POST, JWT 필요)
    @PostMapping("/confirm")
    public ResponseEntity<OrderResponse> confirm(Authentication authentication, @RequestBody TossConfirmRequest request) {
        OrderResponse created = tossPayService.confirm(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
