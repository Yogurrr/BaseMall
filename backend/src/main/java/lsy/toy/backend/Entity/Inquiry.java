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
@Table(name = "inquiries")
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private String category;
    private String title;
    private String content;
    private String imageUrl;
    private String status = "답변대기";
    private String answer;
    private Instant answeredAt;
    private Instant createdAt = Instant.now();

    protected Inquiry() {
        // JPA
    }

    public Inquiry(User user, Order order, String category, String title, String content, String imageUrl) {
        this.user = user;
        this.order = order;
        this.category = category;
        this.title = title;
        this.content = content;
        this.imageUrl = imageUrl;
    }

    // 💡 답변 등록과 동시에 상태를 "답변완료"로 전이시켜, 답변이 있는데 상태가 안 바뀌는 불일치를 막는다.
    public void answer(String answer) {
        this.answer = answer;
        this.answeredAt = Instant.now();
        this.status = "답변완료";
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Order getOrder() { return order; }
    public String getCategory() { return category; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getImageUrl() { return imageUrl; }
    public String getStatus() { return status; }
    public String getAnswer() { return answer; }
    public Instant getAnsweredAt() { return answeredAt; }
    public Instant getCreatedAt() { return createdAt; }
}
