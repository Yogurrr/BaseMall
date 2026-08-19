package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Review;

import java.time.Instant;

public class MyReviewResponse {
    private final Long id;
    private final Long productId;
    private final String productName;
    private final String productImageUrl;
    private final int rating;
    private final String content;
    private final Instant createdAt;

    public MyReviewResponse(Review review) {
        this.id = review.getId();
        this.productId = review.getProduct().getId();
        this.productName = review.getProduct().getName();
        this.productImageUrl = review.getProduct().getImageUrl();
        this.rating = review.getRating();
        this.content = review.getContent();
        this.createdAt = review.getCreatedAt();
    }

    public Long getId() { return id; }
    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public String getProductImageUrl() { return productImageUrl; }
    public int getRating() { return rating; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
