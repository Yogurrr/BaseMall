package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Review;

import java.time.Instant;

public class ReviewResponse {
    private final Long id;
    private final Long userId;
    private final String userName;
    private final int rating;
    private final String content;
    private final Instant createdAt;

    public ReviewResponse(Review review) {
        this.id = review.getId();
        this.userId = review.getUser().getId();
        this.userName = review.getUser().getName();
        this.rating = review.getRating();
        this.content = review.getContent();
        this.createdAt = review.getCreatedAt();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public int getRating() { return rating; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
