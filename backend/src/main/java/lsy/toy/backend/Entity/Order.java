package lsy.toy.backend.Entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

// 💡 장바구니 결제 시 생성되는 주문. "orders"는 SQL 예약어(ORDER BY)라 users처럼 복수형 테이블명 사용.
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer totalPrice;

    // 💡 쿠폰 적용으로 할인된 금액. totalPrice는 할인 반영 후 실제 결제 금액을 의미한다.
    private Integer discountAmount = 0;

    // 💡 결제완료 → 배송준비중 → 배송중 → 배송완료 (주문취소는 언제든 가능)
    private String status = "결제완료";

    private Instant createdAt = Instant.now();

    private String shippingAddress;

    // 💡 배송 시작 후 관리자가 입력하는 운송장 번호. 그 전까지는 null.
    private String trackingNumber;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    protected Order() {
        // JPA
    }

    public Order(User user, Integer totalPrice) {
        this.user = user;
        this.totalPrice = totalPrice;
    }

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Integer getTotalPrice() { return totalPrice; }
    public Integer getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Integer discountAmount) { this.discountAmount = discountAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public List<OrderItem> getItems() { return items; }

    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
}
