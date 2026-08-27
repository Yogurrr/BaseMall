package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    // 💡 인증(로그인/토큰 검증)·회원가입 중복 확인처럼 "누가 요청했는지" 알기 전에
    // 이메일로만 조회해야 하는 경로 전용. users의 RLS(본인/관리자만) 정책을 우회하는
    // 좁은 SECURITY DEFINER 함수(app_auth_lookup_user)를 통해서만 조회한다.
    // 그 외 self-lookup(findByEmail)은 이미 인증된 요청 안에서 자기 자신을 조회하므로
    // 정상 RLS 정책만으로 통과한다.
    @Query(value = "SELECT * FROM app_auth_lookup_user(:email)", nativeQuery = true)
    Optional<User> findAuthCredentialsByEmail(@Param("email") String email);

    // 💡 로그인 성공/실패 결과(연속 실패 횟수, 잠금 만료 시각)를 반영하는 전용 갱신 경로.
    // 인증 전 시점이라 일반 save()는 users_self_or_admin_update RLS 정책에 막히므로,
    // findAuthCredentialsByEmail과 동일한 이유로 SECURITY DEFINER 함수를 통해서만 쓴다.
    // 💡 @Modifying(executeUpdate)으로 호출하지 않는다 — Postgres 함수는 SELECT로 호출하면
    // 반환 타입이 무엇이든 결과 행이 함께 돌아오는데, executeUpdate()는 그걸 오류로 취급한다
    // (V30 참고). 그래서 함수가 정수를 반환하게 하고 일반 조회(executeQuery)로 호출한다.
    @Query(value = "SELECT app_auth_update_login_state(:email, :failedAttempts, :lockedUntil)", nativeQuery = true)
    Integer updateLoginAttemptState(
        @Param("email") String email,
        @Param("failedAttempts") int failedAttempts,
        @Param("lockedUntil") Instant lockedUntil
    );

    // 💡 로그인 실패 등록 전용 경로. 이전엔 Java에서 failedLoginAttempts를 읽어 +1한 절대값을
    // updateLoginAttemptState로 그대로 SET했는데, 동시에 같은 계정으로 실패가 두 번 들어오면
    // 둘 다 같은 이전 값을 읽어 같은 값을 써버려(lost update) 실패 횟수가 유실될 수 있었다.
    // 증가·잠금 판정을 DB 함수 안의 단일 UPDATE 문으로 옮기면 Postgres가 같은 row에 대한
    // UPDATE를 행 잠금으로 직렬화하므로 lost update가 구조적으로 발생하지 않는다(V34 참고).
    @Query(value = "SELECT * FROM app_auth_register_login_failure(:email, :now, :maxAttempts, :lockoutSeconds)", nativeQuery = true)
    LoginFailureState registerLoginFailure(
        @Param("email") String email,
        @Param("now") Instant now,
        @Param("maxAttempts") int maxAttempts,
        @Param("lockoutSeconds") long lockoutSeconds
    );

    interface LoginFailureState {
        Integer getFailedLoginAttempts();
        Instant getLockedUntil();
    }

    // 💡 카카오 로그인 성공 시 기존 계정에 토큰을 연동하는 전용 갱신 경로. 아직 인증 전(로그인 처리
    // 중)이라 일반 save()는 RLS에 막히므로 updateLoginAttemptState와 동일한 이유로
    // SECURITY DEFINER 함수를 통해서만 쓴다.
    @Query(value = "SELECT app_auth_link_kakao_account(:email, :kakaoId, :accessToken, :refreshToken, :expiresAt)", nativeQuery = true)
    Integer linkKakaoAccountBypass(
        @Param("email") String email,
        @Param("kakaoId") Long kakaoId,
        @Param("accessToken") String accessToken,
        @Param("refreshToken") String refreshToken,
        @Param("expiresAt") Instant expiresAt
    );

    List<User> findByUseAt(String useAt);

    long countByUseAt(String useAt);

    long countByCreatedAtBetween(Instant start, Instant end);

    long countByUseAtAndWithdrawnAtBetween(String useAt, Instant start, Instant end);
}
