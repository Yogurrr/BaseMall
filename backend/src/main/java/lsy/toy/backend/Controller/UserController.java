package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.MemberStatsResponse;
import lsy.toy.backend.Dto.OrderResponse;
import lsy.toy.backend.Dto.UserDetailResponse;
import lsy.toy.backend.Dto.UserSummaryResponse;
import lsy.toy.backend.Service.OrderService;
import lsy.toy.backend.Service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final OrderService orderService;

    public UserController(UserService userService, OrderService orderService) {
        this.userService = userService;
        this.orderService = orderService;
    }

    // 1. 사용자 목록 조회 (GET, JWT 필요)
    // 💡 신규 사용자 등록은 /api/auth/register 로 이동 (비밀번호 해싱 + JWT 발급을 함께 처리)
    @GetMapping
    public List<UserSummaryResponse> getUsers() throws InterruptedException {
        // 로딩 상태 확인을 위해 일부러 1초 대기
        Thread.sleep(1000);

        return userService.getUsers().stream().map(UserSummaryResponse::from).toList();
    }

    // 2. 회원 통계 - 신규 가입/탈퇴/등급 분포 (관리자 통계 페이지, GET)
    @GetMapping("/stats")
    public MemberStatsResponse getStats() {
        return userService.getStats();
    }

    // 3. 회원 상세 조회 (관리자 회원 관리 페이지, GET, JWT 필요)
    @GetMapping("/{id}")
    public UserDetailResponse getUser(@PathVariable Long id) {
        return userService.getUserDetail(id);
    }

    // 4. 특정 회원의 주문 목록 조회 (관리자 회원 상세 화면, GET) - 리소스 계층상 /api/orders/user/{id}에서 이동
    @GetMapping("/{userId}/orders")
    public List<OrderResponse> getOrdersByUser(@PathVariable Long userId) {
        return orderService.getOrdersByUserId(userId);
    }
}
