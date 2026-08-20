package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Qna;

import java.time.Instant;

public class MyQnaResponse {
    private final Long id;
    private final Long productId;
    private final String productName;
    private final String productImageUrl;
    private final String question;
    private final String status;
    private final String answer;
    private final Instant answeredAt;
    private final Instant createdAt;

    public MyQnaResponse(Qna qna) {
        this.id = qna.getId();
        this.productId = qna.getProduct().getId();
        this.productName = qna.getProduct().getName();
        this.productImageUrl = qna.getProduct().getImageUrl();
        this.question = qna.getQuestion();
        this.status = qna.getStatus();
        this.answer = qna.getAnswer();
        this.answeredAt = qna.getAnsweredAt();
        this.createdAt = qna.getCreatedAt();
    }

    public Long getId() { return id; }
    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public String getProductImageUrl() { return productImageUrl; }
    public String getQuestion() { return question; }
    public String getStatus() { return status; }
    public String getAnswer() { return answer; }
    public Instant getAnsweredAt() { return answeredAt; }
    public Instant getCreatedAt() { return createdAt; }
}
