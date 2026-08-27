package lsy.toy.backend.Service;

import lsy.toy.backend.Dto.AuthResponse;
import lsy.toy.backend.Dto.RegisterRequest;
import lsy.toy.backend.Dto.UpdateProfileRequest;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.CartItemRepository;
import lsy.toy.backend.Repository.RefreshTokenRepository;
import lsy.toy.backend.Repository.TeamRepository;
import lsy.toy.backend.Repository.UserRepository;
import lsy.toy.backend.Security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private UserService userService;
    @Mock
    private KakaoAuthService kakaoAuthService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest(String email, String password) {
        RegisterRequest request = new RegisterRequest();
        ReflectionTestUtils.setField(request, "name", "김선수");
        ReflectionTestUtils.setField(request, "email", email);
        ReflectionTestUtils.setField(request, "password", password);
        return request;
    }

    private User existingUser(String email, String rawPassword, String encodedPassword, String useAt) {
        User user = new User("이선수", email);
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setPassword(encodedPassword);
        ReflectionTestUtils.setField(user, "useAt", useAt);
        return user;
    }

    @Test
    void register_이미가입된이메일이면_409를던진다() {
        when(userRepository.findAuthCredentialsByEmail("dup@example.com"))
            .thenReturn(Optional.of(existingUser("dup@example.com", "pw", "encoded", "Y")));

        assertThatThrownBy(() -> authService.register(registerRequest("dup@example.com", "Abcd1234")))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(409));
    }

    @Test
    void register_비밀번호규칙에안맞으면_400을던진다() {
        when(userRepository.findAuthCredentialsByEmail("new@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.register(registerRequest("new@example.com", "abc")))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void register_성공하면_토큰과사용자정보를반환한다() {
        when(userRepository.findAuthCredentialsByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Abcd1234")).thenReturn("encoded-pw");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 10L);
            return saved;
        });
        when(jwtService.generateToken("new@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.register(registerRequest("new@example.com", "Abcd1234"));

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getEmail()).isEqualTo("new@example.com");
    }

    @Test
    void login_존재하지않는이메일이면_401을던진다() {
        when(userRepository.findAuthCredentialsByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login("ghost@example.com", "Abcd1234"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void login_탈퇴한계정이면_401을던진다() {
        when(userRepository.findAuthCredentialsByEmail("withdrawn@example.com"))
            .thenReturn(Optional.of(existingUser("withdrawn@example.com", "Abcd1234", "encoded", "N")));

        assertThatThrownBy(() -> authService.login("withdrawn@example.com", "Abcd1234"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void login_비밀번호가틀리면_401을던진다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findAuthCredentialsByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThatThrownBy(() -> authService.login("user@example.com", "wrong"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void login_성공하면_토큰을반환한다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findAuthCredentialsByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Abcd1234", "encoded")).thenReturn(true);
        when(jwtService.generateToken("user@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.login("user@example.com", "Abcd1234");

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getId()).isEqualTo(1L);
        verify(userRepository, never()).updateLoginAttemptState(any(), anyInt(), any());
    }

    @Test
    void login_이전실패기록이있는상태로성공하면_실패횟수를리셋한다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        ReflectionTestUtils.setField(user, "failedLoginAttempts", 3);
        when(userRepository.findAuthCredentialsByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Abcd1234", "encoded")).thenReturn(true);
        when(jwtService.generateToken("user@example.com")).thenReturn("jwt-token");

        authService.login("user@example.com", "Abcd1234");

        verify(userRepository).updateLoginAttemptState("user@example.com", 0, null);
    }

    @Test
    void login_잠금상태면_비밀번호가맞아도_429를던지고_비밀번호를확인하지않는다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        ReflectionTestUtils.setField(user, "lockedUntil", Instant.now().plus(10, ChronoUnit.MINUTES));
        when(userRepository.findAuthCredentialsByEmail("user@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login("user@example.com", "Abcd1234"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(429));

        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void login_비밀번호가틀리면_registerLoginFailure를호출한다() {
        // 💡 증가·잠금 판정 로직이 DB 함수(app_auth_register_login_failure, V34)로 옮겨갔으므로,
        // 여기서는 AuthService가 이전 실패 횟수와 무관하게 이메일/현재시각/임계치/잠금시간을
        // 그대로 위임하는지만 검증한다 — 실제 증가·리셋 판정은 이제 SQL 쪽 책임이라
        // Repository를 목(mock) 처리하는 이 단위 테스트로는 검증할 수 없다.
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findAuthCredentialsByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThatThrownBy(() -> authService.login("user@example.com", "wrong"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));

        ArgumentCaptor<Instant> nowCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(userRepository).registerLoginFailure(eq("user@example.com"), nowCaptor.capture(), eq(5), eq(900L));
        assertThat(nowCaptor.getValue()).isCloseTo(Instant.now(), within(2, ChronoUnit.SECONDS));
    }

    @Test
    void updateProfile_현재비밀번호가틀리면_401을던진다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-current", "encoded")).thenReturn(false);

        UpdateProfileRequest request = new UpdateProfileRequest();
        ReflectionTestUtils.setField(request, "name", "이선수");
        ReflectionTestUtils.setField(request, "currentPassword", "wrong-current");
        ReflectionTestUtils.setField(request, "newPassword", "Newpass12");

        assertThatThrownBy(() -> authService.updateProfile("user@example.com", request))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void deleteAccount_비밀번호가틀리면_401을던진다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThatThrownBy(() -> authService.deleteAccount("user@example.com", "wrong"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));

        verify(cartItemRepository, never()).deleteByUser_Id(any());
        verify(refreshTokenRepository, never()).deleteByUser_Id(any());
    }

    @Test
    void deleteAccount_성공하면_소프트삭제하고장바구니를비운다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Abcd1234", "encoded")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.deleteAccount("user@example.com", "Abcd1234");

        verify(cartItemRepository).deleteByUser_Id(1L);
        verify(refreshTokenRepository).deleteByUser_Id(1L);
        assertThat(user.getUseAt()).isEqualTo("N");
    }

    @Test
    void linkKakaoAccount_성공하면_토큰을저장한다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Instant expiresAt = Instant.now().plusSeconds(3600);
        when(kakaoAuthService.exchangeCodeForToken("auth-code", "/mypage/kakao/callback"))
            .thenReturn(new KakaoAuthService.TokenResult("access-token", "refresh-token", expiresAt));
        when(userService.getMemberGrade(1L)).thenReturn("BRONZE");

        var response = authService.linkKakaoAccount("user@example.com", "auth-code");

        assertThat(response.isKakaoLinked()).isTrue();
        assertThat(user.getKakaoAccessToken()).isEqualTo("access-token");
        assertThat(user.getKakaoRefreshToken()).isEqualTo("refresh-token");
        assertThat(user.getKakaoTokenExpiresAt()).isEqualTo(expiresAt);
    }

    @Test
    void unlinkKakaoAccount_성공하면_토큰을제거한다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        ReflectionTestUtils.setField(user, "kakaoAccessToken", "access-token");
        ReflectionTestUtils.setField(user, "kakaoRefreshToken", "refresh-token");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userService.getMemberGrade(1L)).thenReturn("BRONZE");

        var response = authService.unlinkKakaoAccount("user@example.com");

        assertThat(response.isKakaoLinked()).isFalse();
        assertThat(user.getKakaoAccessToken()).isNull();
        assertThat(user.getKakaoRefreshToken()).isNull();
    }

    private KakaoAuthService.TokenResult kakaoToken() {
        return new KakaoAuthService.TokenResult("access-token", "refresh-token", Instant.now().plusSeconds(3600));
    }

    @Test
    void loginWithKakao_이메일동의가없으면_400을던진다() {
        when(kakaoAuthService.exchangeCodeForToken("auth-code", "/login/kakao/callback")).thenReturn(kakaoToken());
        when(kakaoAuthService.getUserInfo("access-token"))
            .thenReturn(new KakaoAuthService.KakaoProfile(1L, null, "닉네임"));

        assertThatThrownBy(() -> authService.loginWithKakao("auth-code"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }

    @Test
    void loginWithKakao_기존계정이없으면_새로가입시킨다() {
        when(kakaoAuthService.exchangeCodeForToken("auth-code", "/login/kakao/callback")).thenReturn(kakaoToken());
        when(kakaoAuthService.getUserInfo("access-token"))
            .thenReturn(new KakaoAuthService.KakaoProfile(99L, "new-kakao@example.com", "닉네임"));
        when(userRepository.findAuthCredentialsByEmail("new-kakao@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 10L);
            return saved;
        });
        when(jwtService.generateToken("new-kakao@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.loginWithKakao("auth-code");

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getId()).isEqualTo(10L);
        verify(userRepository, never()).linkKakaoAccountBypass(any(), any(), any(), any(), any());
    }

    @Test
    void loginWithKakao_기존계정이있으면_토큰만연동하고로그인한다() {
        User user = existingUser("user@example.com", "Abcd1234", "encoded", "Y");
        KakaoAuthService.TokenResult token = kakaoToken();
        when(kakaoAuthService.exchangeCodeForToken("auth-code", "/login/kakao/callback")).thenReturn(token);
        when(kakaoAuthService.getUserInfo("access-token"))
            .thenReturn(new KakaoAuthService.KakaoProfile(99L, "user@example.com", "닉네임"));
        when(userRepository.findAuthCredentialsByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("user@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.loginWithKakao("auth-code");

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getId()).isEqualTo(1L);
        verify(userRepository).linkKakaoAccountBypass(
            "user@example.com", 99L, token.accessToken(), token.refreshToken(), token.expiresAt());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginWithKakao_탈퇴한계정이면_401을던진다() {
        User user = existingUser("withdrawn@example.com", "Abcd1234", "encoded", "N");
        when(kakaoAuthService.exchangeCodeForToken("auth-code", "/login/kakao/callback")).thenReturn(kakaoToken());
        when(kakaoAuthService.getUserInfo("access-token"))
            .thenReturn(new KakaoAuthService.KakaoProfile(99L, "withdrawn@example.com", "닉네임"));
        when(userRepository.findAuthCredentialsByEmail("withdrawn@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.loginWithKakao("auth-code"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }
}
