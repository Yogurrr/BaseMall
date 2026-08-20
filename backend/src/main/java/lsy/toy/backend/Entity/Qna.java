package lsy.toy.backend.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "product_qna")
public class Qna {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String question;
    private String status = "답변대기";
    private String answer;
    private Instant answeredAt;
    private Instant createdAt = Instant.now();

    protected Qna() {
        // JPA
    }

    public Qna(Product product, User user, String question) {
        this.product = product;
        this.user = user;
        this.question = question;
    }

    // 💡 답변 등록과 동시에 상태를 "답변완료"로 전이시켜, 답변이 있는데 상태가 안 바뀌는 불일치를 막는다.
    public void answer(String answer) {
        this.answer = answer;
        this.answeredAt = Instant.now();
        this.status = "답변완료";
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public User getUser() { return user; }
    public String getQuestion() { return question; }
    public String getStatus() { return status; }
    public String getAnswer() { return answer; }
    public Instant getAnsweredAt() { return answeredAt; }
    public Instant getCreatedAt() { return createdAt; }
}
