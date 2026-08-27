package lsy.toy.backend.Service;

import lsy.toy.backend.Entity.RefreshToken;
import lsy.toy.backend.Entity.User;
import lsy.toy.backend.Repository.RefreshTokenRepository;
import lsy.toy.backend.Repository.UserRepository;
import lsy.toy.backend.Security.AppUserPrincipal;
import lsy.toy.backend.Security.SystemAuthentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

// 💡 액세스 토큰(JwtService, 짧은 수명)과 분리된 리프레시 토큰 발급/로테이션/폐기를 담당한다.
// 로그인/리프레시/로그아웃 전부 "요청 시점엔 SecurityContext가 비어 있는" 인증 이전 경로라,
// RlsAwareDataSource가 RLS 세션변수를 채우지 못해 일반 레포지토리 호출은 전부 막힌다(owner-only 정책).
// 그래서 해시로 신원을 확인한 뒤엔 SystemAuthentication.runAs로 "방금 확인된 그 유저"를 짧게 흉내내
// 이후의 레포지토리 호출(revoke/insert/조회)이 정상 RLS를 통과하게 한다.
// (AuthService처럼 명시적 @Transactional 없이 각 레포지토리 호출의 기본 트랜잭션에 의존하는 스타일을 따른다 —
// 메서드 전체를 @Transactional로 감싸면 SecurityContext를 세팅하기 전에 이미 커넥션을 잡아버려서 안 된다.)
@Service
public class RefreshTokenService {

    private static final String UNAUTHORIZED_MESSAGE = "로그인이 만료되었습니다. 다시 로그인해주세요.";

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final long expirationMs;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
        RefreshTokenRepository refreshTokenRepository,
        UserRepository userRepository,
        @Value("${jwt.refresh-expiration-ms:1209600000}") long expirationMs
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.expirationMs = expirationMs;
    }

    public record IssuedToken(String rawToken, Instant expiresAt) {
    }

    public record RotateResult(Long userId, String email, String name, String role, String rawToken, Instant expiresAt) {
    }

    // 💡 로그인/회원가입 성공 직후 호출된다.
    public IssuedToken issue(Long userId, String email, String role) {
        String rawToken = generateRawToken();
        Instant expiresAt = Instant.now().plusMillis(expirationMs);

        SystemAuthentication.runAs(new AppUserPrincipal(userId, email, null, role), () -> {
            // 이 시점부턴 app.user_id가 방금 로그인/가입한 본인으로 채워져 있어 일반 findByEmail로 조회 가능.
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("방금 로그인/가입한 사용자를 찾을 수 없습니다: " + email));
            refreshTokenRepository.save(new RefreshToken(user, email, hash(rawToken), expiresAt));
        });

        return new IssuedToken(rawToken, expiresAt);
    }

    // 💡 리프레시 토큰 로테이션: 기존 행은 폐기하고 새 행을 발급한다(재사용 탐지를 위한 표준 패턴 —
    // 이미 폐기된 토큰으로 다시 호출하면 아래 isUsable() 체크에서 걸러진다).
    public RotateResult rotate(String rawToken) {
        String tokenHash = hash(rawToken);
        RefreshToken current = refreshTokenRepository.findByTokenHash(tokenHash)
            .filter(RefreshToken::isUsable)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE));

        Long userId = current.getUser().getId();
        String email = current.getEmail();
        // 💡 탈퇴 계정(use_at='N')의 리프레시 토큰은 AuthService.deleteAccount에서 이미 지우지만,
        // 혹시 남아있더라도 로그인과 동일한 기준으로 한 번 더 막는다.
        User user = userRepository.findAuthCredentialsByEmail(email)
            .filter(u -> "Y".equals(u.getUseAt()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE));

        String newRawToken = generateRawToken();
        Instant newExpiresAt = Instant.now().plusMillis(expirationMs);

        SystemAuthentication.runAs(new AppUserPrincipal(userId, email, null, user.getRole()), () -> {
            current.revoke();
            refreshTokenRepository.save(current);
            refreshTokenRepository.save(new RefreshToken(user, email, hash(newRawToken), newExpiresAt));
        });

        return new RotateResult(userId, email, user.getName(), user.getRole(), newRawToken, newExpiresAt);
    }

    // 💡 로그아웃. 쿠키에 담긴 토큰을 폐기만 하고 없거나 이미 무효해도 조용히 넘어간다
    // (로그아웃은 항상 성공한 것처럼 동작해야 하므로).
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(current -> {
            if (!current.isUsable()) {
                return;
            }
            Long userId = current.getUser().getId();
            String email = current.getEmail();
            // 💡 refresh_tokens RLS 정책은 owner-only라 role은 검사에 영향이 없다(SystemAuthentication의
            // SYSTEM_PRINCIPAL이 id를 의미 없이 0으로 두는 것과 같은 이유로 여기선 role이 의미 없다).
            SystemAuthentication.runAs(new AppUserPrincipal(userId, email, null, "USER"), () -> {
                current.revoke();
                refreshTokenRepository.save(current);
            });
        });
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256을 사용할 수 없습니다.", e);
        }
    }
}
