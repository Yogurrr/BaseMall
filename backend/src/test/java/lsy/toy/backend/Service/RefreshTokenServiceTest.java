package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.RefreshToken;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.RefreshTokenRepository;
import lsy.toy.backend.Repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private UserRepository userRepository;

    private final long expirationMs = 1_209_600_000L; // 14일

    private RefreshTokenService newService() {
        return new RefreshTokenService(refreshTokenRepository, userRepository, expirationMs);
    }

    private User existingUser(String email, String useAt) {
        User user = new User("이선수", email);
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setRole("USER");
        ReflectionTestUtils.setField(user, "useAt", useAt);
        return user;
    }

    private RefreshToken tokenFor(User user, Instant expiresAt) {
        return new RefreshToken(user, user.getEmail(), "hashed-value", expiresAt);
    }

    @Test
    void rotate_존재하지않는토큰이면_401을던진다() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        RefreshTokenService service = newService();

        assertThatThrownBy(() -> service.rotate("raw-token"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void rotate_만료된토큰이면_401을던진다() {
        User user = existingUser("user@example.com", "Y");
        RefreshToken expired = tokenFor(user, Instant.now().minusSeconds(10));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(expired));

        RefreshTokenService service = newService();

        assertThatThrownBy(() -> service.rotate("raw-token"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
        verify(userRepository, never()).findAuthCredentialsByEmail(any());
    }

    @Test
    void rotate_이미폐기된토큰이면_401을던진다() {
        User user = existingUser("user@example.com", "Y");
        RefreshToken revoked = tokenFor(user, Instant.now().plusSeconds(3600));
        revoked.revoke();
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(revoked));

        RefreshTokenService service = newService();

        assertThatThrownBy(() -> service.rotate("raw-token"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void rotate_탈퇴한계정이면_401을던진다() {
        User user = existingUser("withdrawn@example.com", "N");
        RefreshToken current = tokenFor(user, Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(current));
        when(userRepository.findAuthCredentialsByEmail("withdrawn@example.com")).thenReturn(Optional.of(user));

        RefreshTokenService service = newService();

        assertThatThrownBy(() -> service.rotate("raw-token"))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode().value()).isEqualTo(401));
    }

    @Test
    void rotate_성공하면_기존토큰을폐기하고새토큰을저장한다() {
        User user = existingUser("user@example.com", "Y");
        RefreshToken current = tokenFor(user, Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(current));
        when(userRepository.findAuthCredentialsByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RefreshTokenService service = newService();
        RefreshTokenService.RotateResult result = service.rotate("raw-token");

        assertThat(current.getRevokedAt()).isNotNull();
        assertThat(result.userId()).isEqualTo(1L);
        assertThat(result.email()).isEqualTo("user@example.com");
        assertThat(result.role()).isEqualTo("USER");
        assertThat(result.rawToken()).isNotBlank();
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    void issue_로그인직후호출되면_새토큰을저장한다() {
        User user = existingUser("user@example.com", "Y");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RefreshTokenService service = newService();
        RefreshTokenService.IssuedToken issued = service.issue(1L, "user@example.com", "USER");

        assertThat(issued.rawToken()).isNotBlank();
        assertThat(issued.expiresAt()).isAfter(Instant.now());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void revoke_토큰이존재하지않으면_아무것도저장하지않는다() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        RefreshTokenService service = newService();
        service.revoke("raw-token");

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void revoke_유효한토큰이면_폐기한다() {
        User user = existingUser("user@example.com", "Y");
        RefreshToken current = tokenFor(user, Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(current));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RefreshTokenService service = newService();
        service.revoke("raw-token");

        assertThat(current.getRevokedAt()).isNotNull();
        verify(refreshTokenRepository).save(current);
    }
}
