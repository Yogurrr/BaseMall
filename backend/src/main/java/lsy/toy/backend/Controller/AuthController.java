package lsy.toy.backend.Controller;

import lsy.toy.backend.Dto.AuthResponse;
import lsy.toy.backend.Dto.DeleteAccountRequest;
import lsy.toy.backend.Dto.LoginRequest;
import lsy.toy.backend.Dto.RegisterRequest;
import lsy.toy.backend.Dto.UpdateFavoriteTeamRequest;
import lsy.toy.backend.Dto.UserInfoResponse;
import lsy.toy.backend.Service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") // 💡 React(Vite) 포트 허용
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // 1. 회원가입 (POST)
    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request.getName(), request.getEmail(), request.getPassword());
    }

    // 2. 로그인 (POST)
    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request.getEmail(), request.getPassword());
    }

    // 3. 현재 로그인한 사용자 정보 조회 (GET, JWT 필요)
    @GetMapping("/me")
    public UserInfoResponse me(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }

    // 4. 회원 탈퇴 (DELETE, JWT 필요, 비밀번호 재확인)
    @DeleteMapping("/me")
    public void deleteAccount(Authentication authentication, @RequestBody DeleteAccountRequest request) {
        authService.deleteAccount(authentication.getName(), request.getPassword());
    }

    // 5. 응원팀 설정/변경 (PATCH, JWT 필요, 마이페이지)
    @PatchMapping("/me/favorite-team")
    public UserInfoResponse updateFavoriteTeam(Authentication authentication, @RequestBody UpdateFavoriteTeamRequest request) {
        return authService.updateFavoriteTeam(authentication.getName(), request.getTeam());
    }
}
