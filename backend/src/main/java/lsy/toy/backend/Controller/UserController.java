package lsy.toy.backend.Controller;

import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 1. 사용자 목록 조회 (GET, JWT 필요)
    // 💡 신규 사용자 등록은 /api/auth/register 로 이동 (비밀번호 해싱 + JWT 발급을 함께 처리)
    @GetMapping
    public List<User> getUsers() throws InterruptedException {
        // 로딩 상태 확인을 위해 일부러 1초 대기
        Thread.sleep(1000);

        return userService.getUsers();
    }
}
