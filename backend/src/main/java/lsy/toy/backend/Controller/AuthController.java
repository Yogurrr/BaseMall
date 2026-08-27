package lsy.toy.backend.Controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lsy.toy.backend.Dto.AuthResponse;
import lsy.toy.backend.Dto.DeleteAccountRequest;
import lsy.toy.backend.Dto.KakaoLinkRequest;
import lsy.toy.backend.Dto.LoginRequest;
import lsy.toy.backend.Dto.RegisterRequest;
import lsy.toy.backend.Dto.UpdateFavoriteTeamRequest;
import lsy.toy.backend.Dto.UpdateProfileRequest;
import lsy.toy.backend.Dto.UserInfoResponse;
import lsy.toy.backend.Security.JwtService;
import lsy.toy.backend.Service.AuthService;
import lsy.toy.backend.Service.RefreshTokenService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
// 💡 클래스 레벨 @CrossOrigin을 쓰지 않는다 — SecurityConfig의 corsConfigurationSource 빈(AllowCredentials=true)과
// 별도 메커니즘이 겹치면 쿠키 관련 CORS 헤더가 예상과 다르게 처리될 수 있어, 리프레시 쿠키를 다루는
// 이 컨트롤러는 SecurityConfig 하나로 일원화한다.
public class AuthController {

    // 💡 리프레시 쿠키 발급/삭제 시 서로 다른 값을 실수로 섞어 쓰지 않도록 상수로 고정한다.
    private static final String REFRESH_COOKIE_NAME = "refresh_token";
    private static final String REFRESH_COOKIE_PATH = "/api/auth";

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, RefreshTokenService refreshTokenService, JwtService jwtService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
    }

    // 1. 회원가입 (POST)
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse created = authService.register(request);
        issueRefreshCookie(response, created.getId(), created.getEmail(), created.getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 2. 로그인 (POST)
    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse result = authService.login(request.getEmail(), request.getPassword());
        issueRefreshCookie(response, result.getId(), result.getEmail(), result.getRole());
        return result;
    }

    // 2-0. 카카오 로그인 (POST, JWT 불필요 - 로그인 화면의 "카카오로 시작하기". 계정이 없으면 자동 가입)
    @PostMapping("/kakao/login")
    public AuthResponse loginWithKakao(@Valid @RequestBody KakaoLinkRequest request, HttpServletResponse response) {
        AuthResponse result = authService.loginWithKakao(request.getCode());
        issueRefreshCookie(response, result.getId(), result.getEmail(), result.getRole());
        return result;
    }

    // 2-1. 액세스 토큰 재발급 (POST, 리프레시 쿠키 필요)
    // 💡 Authorization 헤더가 아니라 httpOnly 쿠키로 신원을 확인하는 유일한 경로라 SecurityConfig에서 permitAll이다.
    @PostMapping("/refresh")
    public AuthResponse refresh(
        @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
        HttpServletResponse response
    ) {
        if (refreshToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        RefreshTokenService.RotateResult rotated = refreshTokenService.rotate(refreshToken);
        setRefreshCookie(response, rotated.rawToken(), rotated.expiresAt());
        String accessToken = jwtService.generateToken(rotated.email());
        return new AuthResponse(accessToken, rotated.userId(), rotated.name(), rotated.email(), rotated.role());
    }

    // 2-2. 로그아웃 (POST)
    // 💡 리프레시 쿠키가 없어도(이미 만료 등) 항상 204로 응답해 클라이언트가 로그아웃 실패를 걱정하지 않게 한다.
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
        @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
        HttpServletResponse response
    ) {
        if (refreshToken != null) {
            refreshTokenService.revoke(refreshToken);
        }
        clearRefreshCookie(response);
        return ResponseEntity.noContent().build();
    }

    private void issueRefreshCookie(HttpServletResponse response, Long userId, String email, String role) {
        RefreshTokenService.IssuedToken issued = refreshTokenService.issue(userId, email, role);
        setRefreshCookie(response, issued.rawToken(), issued.expiresAt());
    }

    // 💡 secure(false)는 로컬 http 개발환경 전용이다 — 배포 시엔 true로 바꿔야 한다.
    // SameSite=Lax는 프론트(:5173)/백엔드(:8080)가 포트만 다른 동일 도메인(localhost)이라 정상 요청엔
    // 그대로 실리면서, 진짜 크로스사이트 요청(다른 도메인에서 이 쿠키를 실어 POST)은 막아줘서 별도
    // CSRF 토큰 없이도 refresh/logout 두 엔드포인트를 보호한다. 배포 시 프론트/백엔드가 서로 다른
    // 도메인이 되면 SameSite=None+Secure로 바꿔야 하고, 그때는 Origin 헤더 검증 같은 별도 방어가 필요하다.
    private void setRefreshCookie(HttpServletResponse response, String rawToken, Instant expiresAt) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, rawToken)
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path(REFRESH_COOKIE_PATH)
            .maxAge(Duration.between(Instant.now(), expiresAt))
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path(REFRESH_COOKIE_PATH)
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // 3. 현재 로그인한 사용자 정보 조회 (GET, JWT 필요)
    @GetMapping("/me")
    public UserInfoResponse me(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }

    // 4. 회원 탈퇴 (DELETE, JWT 필요, 비밀번호 재확인)
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(Authentication authentication, @RequestBody DeleteAccountRequest request) {
        authService.deleteAccount(authentication.getName(), request.getPassword());
        return ResponseEntity.noContent().build();
    }

    // 5. 응원팀 설정/변경 (PATCH, JWT 필요, 마이페이지)
    @PatchMapping("/me/favorite-team")
    public UserInfoResponse updateFavoriteTeam(Authentication authentication, @RequestBody UpdateFavoriteTeamRequest request) {
        return authService.updateFavoriteTeam(authentication.getName(), request.getTeam());
    }

    // 6. 회원 정보 수정 (PATCH, JWT 필요, 이름/생년월일/휴대폰번호/비밀번호. 이메일은 수정 불가)
    @PatchMapping("/me")
    public UserInfoResponse updateProfile(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        return authService.updateProfile(authentication.getName(), request);
    }

    // 7. 카카오 계정 연동 (POST, JWT 필요, 마이페이지 - 주문/배송 알림용 talk_message 동의)
    @PostMapping("/kakao/link")
    public UserInfoResponse linkKakao(Authentication authentication, @Valid @RequestBody KakaoLinkRequest request) {
        return authService.linkKakaoAccount(authentication.getName(), request.getCode());
    }

    // 7-1. 카카오 계정 연동 해제 (DELETE, JWT 필요)
    @DeleteMapping("/kakao/link")
    public UserInfoResponse unlinkKakao(Authentication authentication) {
        return authService.unlinkKakaoAccount(authentication.getName());
    }
}
