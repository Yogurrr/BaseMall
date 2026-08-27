package lsy.toy.backend.Security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "test-secret-key-for-jwt-service-unit-test-1234567890";

    @Test
    void generateToken_에서추출한이메일이_원래이메일과같다() {
        JwtService jwtService = new JwtService(SECRET, 3_600_000);

        String token = jwtService.generateToken("user@example.com");

        assertThat(jwtService.extractEmail(token)).isEqualTo("user@example.com");
    }

    @Test
    void isValid_만료전토큰이면_true를반환한다() {
        JwtService jwtService = new JwtService(SECRET, 3_600_000);

        String token = jwtService.generateToken("user@example.com");

        assertThat(jwtService.isValid(token)).isTrue();
    }

    @Test
    void isValid_만료된토큰이면_false를반환한다() throws InterruptedException {
        JwtService jwtService = new JwtService(SECRET, 1);

        String token = jwtService.generateToken("user@example.com");
        Thread.sleep(10);

        assertThat(jwtService.isValid(token)).isFalse();
    }

    @Test
    void isValid_형식이잘못된토큰이면_예외대신false를반환한다() {
        JwtService jwtService = new JwtService(SECRET, 3_600_000);

        assertThat(jwtService.isValid("not-a-valid-jwt")).isFalse();
    }

    @Test
    void isValid_다른시크릿으로서명된토큰이면_false를반환한다() {
        JwtService issuer = new JwtService(SECRET, 3_600_000);
        JwtService verifier = new JwtService("different-secret-key-for-jwt-service-unit-test", 3_600_000);

        String token = issuer.generateToken("user@example.com");

        assertThat(verifier.isValid(token)).isFalse();
    }
}
