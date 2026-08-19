package lsy.toy.backend.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

// 💡 토스페이먼츠 결제 준비(prepare)~승인(confirm) 사이에만 존재하는 임시 레코드.
// 승인 성공 시 TossPayService가 실제 Order를 만들고 이 row는 삭제한다.
// amount는 confirm 시점에 프론트가 보낸 금액이 위조되지 않았는지 검증하는 기준값이다.
@Entity
@Table(name = "toss_pending_payments")
public class TossPendingPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String orderId;

    private Long userId;
    private int amount;

    @Column(columnDefinition = "text")
    private String requestPayload;

    private Instant createdAt = Instant.now();

    @Enumerated(EnumType.STRING)
    private PendingPaymentStatus status = PendingPaymentStatus.READY;

    // 💡 PG 취소 API 호출에 필요한 값. confirm 요청이 들어올 때(승인 직전) 채워 넣는다.
    private String paymentKey;

    // 💡 PG 승인에 성공한 시각. 정합성 배치가 "이 시각 이후로 오래 방치된 APPROVED 건"을 고른다.
    private Instant approvedAt;

    private int retryCount = 0;

    @Column(columnDefinition = "text")
    private String lastError;

    protected TossPendingPayment() {
        // JPA
    }

    public TossPendingPayment(String orderId, Long userId, int amount, String requestPayload) {
        this.orderId = orderId;
        this.userId = userId;
        this.amount = amount;
        this.requestPayload = requestPayload;
    }

    public Long getId() { return id; }
    public String getOrderId() { return orderId; }
    public Long getUserId() { return userId; }
    public int getAmount() { return amount; }
    public String getRequestPayload() { return requestPayload; }
    public Instant getCreatedAt() { return createdAt; }
    public PendingPaymentStatus getStatus() { return status; }
    public String getPaymentKey() { return paymentKey; }
    public Instant getApprovedAt() { return approvedAt; }
    public int getRetryCount() { return retryCount; }
    public String getLastError() { return lastError; }

    public void markApproved(String paymentKey) {
        this.paymentKey = paymentKey;
        this.status = PendingPaymentStatus.APPROVED;
        this.approvedAt = Instant.now();
    }

    public void recordRetryFailure(String error) {
        this.retryCount++;
        this.lastError = error;
    }
}
