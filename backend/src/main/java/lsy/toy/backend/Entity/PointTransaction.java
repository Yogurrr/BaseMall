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

// 💡 적립금 잔액(User.points) 변동 이력 한 줄. amount는 양수면 적립, 음수면 사용/차감을 뜻한다.
@Entity
@Table(name = "point_transactions")
public class PointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer amount;

    // 💡 ORDER_EARN / ORDER_USE / ORDER_CANCEL / REVIEW_REWARD / REVIEW_REWARD_REVOKE
    private String type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id")
    private Review review;

    private String description;
    private Instant createdAt = Instant.now();

    protected PointTransaction() {
        // JPA
    }

    public PointTransaction(User user, Integer amount, String type, Order order, Review review, String description) {
        this.user = user;
        this.amount = amount;
        this.type = type;
        this.order = order;
        this.review = review;
        this.description = description;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Integer getAmount() { return amount; }
    public String getType() { return type; }
    public Order getOrder() { return order; }
    public Review getReview() { return review; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
}
