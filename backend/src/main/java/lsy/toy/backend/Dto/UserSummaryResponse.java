package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.User;

public class UserSummaryResponse {
    private final Long id;
    private final String name;
    private final String email;

    public UserSummaryResponse(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(user.getId(), user.getName(), user.getEmail());
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
}
