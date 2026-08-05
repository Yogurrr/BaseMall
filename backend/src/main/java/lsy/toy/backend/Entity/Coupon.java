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

// 💡 회원 등급별로 관리자가 발급하는 할인 쿠폰. 결제 시 한 장 선택해 적용하면 used_at/order가 채워진다.
@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private String name;

    private String grade;

    private Integer discountPercent;

    private Instant issuedAt = Instant.now();

    private Instant usedAt;

    protected Coupon() {
        // JPA
    }

    public Coupon(User user, String name, String grade, Integer discountPercent) {
        this.user = user;
        this.name = name;
        this.grade = grade;
        this.discountPercent = discountPercent;
    }

    public void markUsed(Order order) {
        this.order = order;
        this.usedAt = Instant.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Order getOrder() { return order; }
    public String getName() { return name; }
    public String getGrade() { return grade; }
    public Integer getDiscountPercent() { return discountPercent; }
    public Instant getIssuedAt() { return issuedAt; }
    public Instant getUsedAt() { return usedAt; }
}
