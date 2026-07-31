package lsy.toy.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "users") // 💡 "user"는 Postgres 예약어라 복수형 테이블명 사용
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;

    // 💡 bcrypt로 해싱된 값만 저장. 응답 JSON에는 절대 포함하지 않는다.
    private String password;

    // 💡 "USER" 또는 "ADMIN". 회원가입으로 만든 계정은 항상 USER.
    private String role = "USER";

    // 💡 마이페이지에서 고르는 응원팀. 아직 고르지 않았을 수 있으니 nullable.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "favorite_team_id")
    private Team favoriteTeam;

    protected User() {
        // JPA
    }

    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }

    @JsonIgnore
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Team getFavoriteTeam() { return favoriteTeam; }
    public void setFavoriteTeam(Team favoriteTeam) { this.favoriteTeam = favoriteTeam; }
}
