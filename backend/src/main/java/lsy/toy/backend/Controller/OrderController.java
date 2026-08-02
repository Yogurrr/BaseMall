package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Dto.UpdateOrderStatusRequest;
import lsy.toy.backend.Dto.UpdateTrackingNumberRequest;
import lsy.toy.backend.Service.OrderService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // 1. 장바구니 기반 주문 생성 (결제하기, POST, JWT 필요)
    @PostMapping
    public OrderResponse createOrder(Authentication authentication, @RequestBody CreateOrderRequest request) {
        return orderService.createOrderFromCart(authentication.getName(), request.getAddress());
    }

    // 2. 전체 주문 목록 조회 (관리자 주문 관리 화면, GET)
    @GetMapping
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders();
    }

    // 2-1. 내 주문 목록 조회 (마이페이지 대시보드, GET)
    @GetMapping("/me")
    public List<OrderResponse> getMyOrders(Authentication authentication) {
        return orderService.getMyOrders(authentication.getName());
    }

    // 3. 주문 상태 변경 (관리자, PATCH)
    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id, @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(id, request.getStatus());
    }

    // 4. 운송장 번호 등록/수정 (관리자, PATCH)
    @PatchMapping("/{id}/tracking")
    public OrderResponse updateTrackingNumber(@PathVariable Long id, @RequestBody UpdateTrackingNumberRequest request) {
        return orderService.updateTrackingNumber(id, request.getTrackingNumber());
    }
}
