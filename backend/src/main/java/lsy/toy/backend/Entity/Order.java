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

    // 💡 배송 시작 후 관리자가 입력하는 운송장 번호. 그 전까지는 null.
    private String trackingNumber;

    private String recipientName;
    private String recipientPhone;
    private String zipCode;
    private String address;
    private String addressDetail;

    // 💡 주문자가 입력한 배송 요청사항 (예: "부재 시 연락 부탁드려요"). 없으면 null.
    private String deliveryRequest;

    // 💡 공동현관 출입방법: 비밀번호/경비실호출/자유출입가능/기타사항 중 하나. OrderService.VALID_ENTRY_METHODS로 검증.
    private String entryMethod;

    // 💡 entryMethod가 "비밀번호"면 출입 비밀번호, "기타사항"이면 자유 텍스트. 그 외에는 null.
    private String entryNote;

    // 💡 카카오페이/토스페이먼츠 중 하나. OrderService.VALID_PAYMENT_METHODS로 검증.
    private String paymentMethod;

    // 💡 이 주문에서 사용/적립된 적립금. totalPrice는 pointsUsed까지 차감된 실제 결제 금액이다.
    private Integer pointsUsed = 0;
    private Integer pointsEarned = 0;

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

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAddressDetail() { return addressDetail; }
    public void setAddressDetail(String addressDetail) { this.addressDetail = addressDetail; }

    public String getDeliveryRequest() { return deliveryRequest; }
    public void setDeliveryRequest(String deliveryRequest) { this.deliveryRequest = deliveryRequest; }

    public String getEntryMethod() { return entryMethod; }
    public void setEntryMethod(String entryMethod) { this.entryMethod = entryMethod; }

    public String getEntryNote() { return entryNote; }
    public void setEntryNote(String entryNote) { this.entryNote = entryNote; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Integer getPointsUsed() { return pointsUsed; }
    public void setPointsUsed(Integer pointsUsed) { this.pointsUsed = pointsUsed; }

    public Integer getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(Integer pointsEarned) { this.pointsEarned = pointsEarned; }
}
