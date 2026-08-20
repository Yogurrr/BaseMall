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

    // 💡 실제로 행을 지우지 않고 use_at을 'N'으로 바꾸는 소프트 삭제 (Product.deleteProduct와 동일한 패턴).
    public void withdraw() {
        this.useAt = "N";
        this.withdrawnAt = Instant.now();
    }
}
