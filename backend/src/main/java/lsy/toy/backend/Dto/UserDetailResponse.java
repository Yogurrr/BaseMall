package lsy.toy.backend.Dto;

import java.time.Instant;

public class UserDetailResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String favoriteTeam;
    private String grade;
    private Integer points;
    private Instant createdAt;
    private String useAt;
    private Instant withdrawnAt;

    public UserDetailResponse(
        Long id, String name, String email, String role, String favoriteTeam,
        String grade, Integer points, Instant createdAt, String useAt, Instant withdrawnAt
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.favoriteTeam = favoriteTeam;
        this.grade = grade;
        this.points = points;
        this.createdAt = createdAt;
        this.useAt = useAt;
        this.withdrawnAt = withdrawnAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getFavoriteTeam() { return favoriteTeam; }
    public String getGrade() { return grade; }
    public Integer getPoints() { return points; }
    public Instant getCreatedAt() { return createdAt; }
    public String getUseAt() { return useAt; }
    public Instant getWithdrawnAt() { return withdrawnAt; }
}
