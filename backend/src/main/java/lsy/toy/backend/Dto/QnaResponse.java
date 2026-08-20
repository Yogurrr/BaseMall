package lsy.toy.backend.Dto;

import lsy.toy.backend.Entity.Qna;

import java.time.Instant;

public class QnaResponse {
    private final Long id;
    private final Long userId;
    private final String userName;
    private final String question;
    private final String status;
    private final String answer;
    private final Instant answeredAt;
    private final Instant createdAt;

    public QnaResponse(Qna qna) {
        this.id = qna.getId();
        this.userId = qna.getUser().getId();
        this.userName = qna.getUser().getName();
        this.question = qna.getQuestion();
        this.status = qna.getStatus();
        this.answer = qna.getAnswer();
        this.answeredAt = qna.getAnsweredAt();
        this.createdAt = qna.getCreatedAt();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public String getQuestion() { return question; }
    public String getStatus() { return status; }
    public String getAnswer() { return answer; }
    public Instant getAnsweredAt() { return answeredAt; }
    public Instant getCreatedAt() { return createdAt; }
}
