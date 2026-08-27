package lsy.toy.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "users") // 💡 "user"는 Postgres 예약어라 복수형 테이블명 사용
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;

    private LocalDate birthDate;
    private String phoneNumber;

    // 💡 bcrypt로 해싱된 값만 저장. 응답 JSON에는 절대 포함하지 않는다.
    private String password;

    // 💡 "USER" 또는 "ADMIN". 회원가입으로 만든 계정은 항상 USER.
    private String role = "USER";

    // 💡 마이페이지에서 고르는 응원팀. 아직 고르지 않았을 수 있으니 nullable.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "favorite_team_id")
    private Team favoriteTeam;

    // 💡 신규 가입자 통계용. products.created_at과 동일하게 Instant는 timestamptz여야 한다.
    @Column(columnDefinition = "timestamptz not null default now()")
    private Instant createdAt = Instant.now();

    // 💡 회원 탈퇴 소프트 삭제 플래그. products.use_at과 동일한 Y/N 패턴 (Y=활성, N=탈퇴).
    @Column(columnDefinition = "varchar(1) not null default 'Y'")
    private String useAt = "Y";

    // 💡 탈퇴 시각. 탈퇴 전에는 null, "이번 달 탈퇴 회원" 같은 기간 집계에 쓴다.
    private Instant withdrawnAt;

    // 💡 적립금 잔액. 주문 시 사용해 결제금액을 차감하고, 결제 완료 시 결제금액의 1%가 적립된다.
    @Column(nullable = false)
    private Integer points = 0;

    // 💡 브루트포스 방지용 연속 로그인 실패 횟수. 성공하면 0으로 리셋된다.
    // AuthService.login에서만 갱신하며, 인증 전 상태라 app_auth_update_login_state
    // SECURITY DEFINER 함수를 통해서만 실제 DB 값이 바뀐다(엔티티 setter로 저장 X).
    @Column(nullable = false)
    private Integer failedLoginAttempts = 0;

    // 💡 failedLoginAttempts가 임계치를 넘으면 이 시각까지 로그인 자체를 막는다. 평소엔 null.
    private Instant lockedUntil;

    // 💡 카카오 "나에게 보내기" 알림 연동 정보. 연동하지 않은 회원은 전부 null.
    // 로그인 자체는 여전히 이메일/비밀번호(JWT) 방식이고, 이 필드들은 talk_message
    // 스코프 동의로 얻은 토큰을 보관해 주문 알림 발송에만 쓴다.
    private Long kakaoId;
    @Column(columnDefinition = "text")
    private String kakaoAccessToken;
    @Column(columnDefinition = "text")
    private String kakaoRefreshToken;
    private Instant kakaoTokenExpiresAt;

    protected User() {
        // JPA
    }

    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    @JsonIgnore
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Team getFavoriteTeam() { return favoriteTeam; }
    public void setFavoriteTeam(Team favoriteTeam) { this.favoriteTeam = favoriteTeam; }

    public Instant getCreatedAt() { return createdAt; }

    public String getUseAt() { return useAt; }

    public Instant getWithdrawnAt() { return withdrawnAt; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public Integer getFailedLoginAttempts() { return failedLoginAttempts; }
    public Instant getLockedUntil() { return lockedUntil; }

    public Long getKakaoId() { return kakaoId; }
    public void setKakaoId(Long kakaoId) { this.kakaoId = kakaoId; }
    public String getKakaoAccessToken() { return kakaoAccessToken; }
    public void setKakaoAccessToken(String kakaoAccessToken) { this.kakaoAccessToken = kakaoAccessToken; }
    public String getKakaoRefreshToken() { return kakaoRefreshToken; }
    public void setKakaoRefreshToken(String kakaoRefreshToken) { this.kakaoRefreshToken = kakaoRefreshToken; }
    public Instant getKakaoTokenExpiresAt() { return kakaoTokenExpiresAt; }
    public void setKakaoTokenExpiresAt(Instant kakaoTokenExpiresAt) { this.kakaoTokenExpiresAt = kakaoTokenExpiresAt; }

    // 💡 연동 해제 시 관련 필드를 한 번에 초기화 (withdraw()와 동일한 스타일의 도메인 동작 메서드).
    public void unlinkKakao() {
        this.kakaoId = null;
        this.kakaoAccessToken = null;
        this.kakaoRefreshToken = null;
        this.kakaoTokenExpiresAt = null;
    }

    // 💡 실제로 행을 지우지 않고 use_at을 'N'으로 바꾸는 소프트 삭제 (Product.deleteProduct와 동일한 패턴).
    public void withdraw() {
        this.useAt = "N";
        this.withdrawnAt = Instant.now();
    }
}
