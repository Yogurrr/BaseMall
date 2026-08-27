package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.KakaoApproveRequest;
import lsy.toy.backend.Dto.KakaoReadyResponse;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Service.KakaoPayService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/kakao")
public class PaymentController {

    private final KakaoPayService kakaoPayService;

    public PaymentController(KakaoPayService kakaoPayService) {
        this.kakaoPayService = kakaoPayService;
    }

    // 1. 카카오페이 결제 준비 - 장바구니 기준 금액을 계산해 카카오 결제창 URL을 받아온다 (POST, JWT 필요)
    @PostMapping("/ready")
    public KakaoReadyResponse ready(Authentication authentication, @RequestBody CreateOrderRequest request) {
        return kakaoPayService.ready(authentication.getName(), request);
    }

    // 2. 카카오페이 결제 승인 - 결제창에서 돌아온 뒤 승인 처리하고 실제 주문을 생성한다 (POST, JWT 필요)
    @PostMapping("/approve")
    public ResponseEntity<OrderResponse> approve(Authentication authentication, @RequestBody KakaoApproveRequest request) {
        OrderResponse created = kakaoPayService.approve(authentication.getName(), request.getOrderId(), request.getPgToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
