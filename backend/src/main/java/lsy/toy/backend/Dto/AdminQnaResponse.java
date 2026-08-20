package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Qna;

import java.time.Instant;

public class AdminQnaResponse {
    private final Long id;
    private final String authorName;
    private final String authorEmail;
    private final Long productId;
    private final String productName;
    private final String question;
    private final String status;
    private final String answer;
    private final Instant answeredAt;
    private final Instant createdAt;

    public AdminQnaResponse(Qna qna) {
        this.id = qna.getId();
        this.authorName = qna.getUser().getName();
        this.authorEmail = qna.getUser().getEmail();
        this.productId = qna.getProduct().getId();
        this.productName = qna.getProduct().getName();
        this.question = qna.getQuestion();
        this.status = qna.getStatus();
        this.answer = qna.getAnswer();
        this.answeredAt = qna.getAnsweredAt();
        this.createdAt = qna.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getAuthorName() { return authorName; }
    public String getAuthorEmail() { return authorEmail; }
    public Long getProductId() { return productId; }
    public String getProductName() { return productName; }
    public String getQuestion() { return question; }
    public String getStatus() { return status; }
    public String getAnswer() { return answer; }
    public Instant getAnsweredAt() { return answeredAt; }
    public Instant getCreatedAt() { return createdAt; }
}
