package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Inquiry;

import java.time.Instant;

public class InquiryResponse {
    private final Long id;
    private final String category;
    private final String title;
    private final String content;
    private final String imageUrl;
    private final Long orderId;
    private final String status;
    private final String answer;
    private final Instant answeredAt;
    private final Instant createdAt;

    public InquiryResponse(Inquiry inquiry) {
        this.id = inquiry.getId();
        this.category = inquiry.getCategory();
        this.title = inquiry.getTitle();
        this.content = inquiry.getContent();
        this.imageUrl = inquiry.getImageUrl();
        this.orderId = inquiry.getOrder() != null ? inquiry.getOrder().getId() : null;
        this.status = inquiry.getStatus();
        this.answer = inquiry.getAnswer();
        this.answeredAt = inquiry.getAnsweredAt();
        this.createdAt = inquiry.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getCategory() { return category; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getImageUrl() { return imageUrl; }
    public Long getOrderId() { return orderId; }
    public String getStatus() { return status; }
    public String getAnswer() { return answer; }
    public Instant getAnsweredAt() { return answeredAt; }
    public Instant getCreatedAt() { return createdAt; }
}
