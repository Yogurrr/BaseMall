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

    List<User> findByUseAt(String useAt);

    long countByUseAt(String useAt);

    long countByCreatedAtBetween(Instant start, Instant end);

    long countByUseAtAndWithdrawnAtBetween(String useAt, Instant start, Instant end);
}
