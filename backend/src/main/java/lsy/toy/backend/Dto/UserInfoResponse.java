package lsy.toy.backend.Dto;

public class UserInfoResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String favoriteTeam;
    private String grade;
    private Integer points;

    public UserInfoResponse(Long id, String name, String email, String role, String favoriteTeam, String grade, Integer points) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.favoriteTeam = favoriteTeam;
        this.grade = grade;
        this.points = points;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getFavoriteTeam() { return favoriteTeam; }
    public String getGrade() { return grade; }
    public Integer getPoints() { return points; }
}
