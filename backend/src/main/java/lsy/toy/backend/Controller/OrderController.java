package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.CreateOrderRequest;
import lsy.toy.backend.Dto.OrderCountStatsResponse;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Dto.SalesBreakdownResponse;
import lsy.toy.backend.Dto.SalesResponse;
import lsy.toy.backend.Dto.UpdateOrderStatusRequest;
import lsy.toy.backend.Dto.UpdateTrackingNumberRequest;
import lsy.toy.backend.Service.OrderService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
    public ResponseEntity<OrderResponse> createOrder(Authentication authentication, @RequestBody CreateOrderRequest request) {
        OrderResponse created = orderService.createOrderFromCart(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
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

    // 💡 특정 회원의 주문 목록 조회는 리소스 계층상 GET /api/users/{userId}/orders (UserController)로 이동

    // 2-2. 매출 통계 - 일/월/연 매출 및 월별 추이 (관리자 매출 페이지, GET)
    @GetMapping("/sales")
    public SalesResponse getSales() {
        return orderService.getSalesSummary();
    }

    // 2-3. 기간별 매출 - 구단별/품목별 집계 (관리자 매출 페이지, GET)
    @GetMapping("/sales/breakdown")
    public SalesBreakdownResponse getSalesBreakdown(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return orderService.getSalesBreakdown(from, to);
    }

    // 2-4. 주문 건수 통계 - 일별/월별 주문 건수 (관리자 통계 페이지, GET)
    @GetMapping("/count-stats")
    public OrderCountStatsResponse getOrderCountStats() {
        return orderService.getOrderCountStats();
    }

    // 3. 주문 상태 변경 (관리자, PATCH)
    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id, @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(id, request.getStatus());
    }

    // 3-1. 주문 취소 (고객 본인, PATCH) - 결제완료 상태에서만 가능
    @PatchMapping("/{id}/cancel")
    public OrderResponse cancelMyOrder(Authentication authentication, @PathVariable Long id) {
        return orderService.cancelMyOrder(authentication.getName(), id);
    }

    // 4. 운송장 번호 등록/수정 (관리자, PATCH)
    @PatchMapping("/{id}/tracking")
    public OrderResponse updateTrackingNumber(@PathVariable Long id, @RequestBody UpdateTrackingNumberRequest request) {
        return orderService.updateTrackingNumber(id, request.getTrackingNumber());
    }
}
