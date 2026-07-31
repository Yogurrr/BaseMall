package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Dto.UpdateOrderStatusRequest;
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
    public OrderResponse createOrder(Authentication authentication) {
        return orderService.createOrderFromCart(authentication.getName());
    }

    // 2. 전체 주문 목록 조회 (관리자 주문 관리 화면, GET)
    @GetMapping
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders();
    }

    // 3. 주문 상태 변경 (관리자, PATCH)
    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id, @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(id, request.getStatus());
    }
}
