package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // 💡 인증(리프레시/로그아웃) 전용 조회 경로. users의 findAuthCredentialsByEmail과 동일한 이유로
    // RLS(본인만)를 우회하는 좁은 SECURITY DEFINER 함수(app_auth_lookup_refresh_token)를 통해서만 조회한다.
    @Query(value = "SELECT * FROM app_auth_lookup_refresh_token(:tokenHash)", nativeQuery = true)
    Optional<RefreshToken> findByTokenHash(@Param("tokenHash") String tokenHash);

    void deleteByUser_Id(Long userId);
}
