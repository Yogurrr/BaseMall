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

// 💡 카카오페이 결제 준비(ready)~승인(approve) 사이에만 존재하는 임시 레코드.
// 승인 성공 시 KakaoPayService가 실제 Order를 만들고 이 row는 삭제한다.
@Entity
@Table(name = "kakao_pending_payments")
public class KakaoPendingPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tid;
    private String partnerOrderId;
    private Long userId;

    @Column(columnDefinition = "text")
    private String requestPayload;

    private Instant createdAt = Instant.now();

    @Enumerated(EnumType.STRING)
    private PendingPaymentStatus status = PendingPaymentStatus.READY;

    // 💡 PG 승인/취소 API에 그대로 넘길 청구 금액. ready 시점에 계산해 둔다.
    private Integer amount;

    // 💡 PG 승인에 성공한 시각. 정합성 배치가 "이 시각 이후로 오래 방치된 APPROVED 건"을 고른다.
    private Instant approvedAt;

    private int retryCount = 0;

    @Column(columnDefinition = "text")
    private String lastError;

    protected KakaoPendingPayment() {
        // JPA
    }

    public KakaoPendingPayment(String tid, String partnerOrderId, Long userId, String requestPayload, Integer amount) {
        this.tid = tid;
        this.partnerOrderId = partnerOrderId;
        this.userId = userId;
        this.requestPayload = requestPayload;
        this.amount = amount;
    }

    public Long getId() { return id; }
    public String getTid() { return tid; }
    public String getPartnerOrderId() { return partnerOrderId; }
    public Long getUserId() { return userId; }
    public String getRequestPayload() { return requestPayload; }
    public Instant getCreatedAt() { return createdAt; }
    public PendingPaymentStatus getStatus() { return status; }
    public Integer getAmount() { return amount; }
    public Instant getApprovedAt() { return approvedAt; }
    public int getRetryCount() { return retryCount; }
    public String getLastError() { return lastError; }

    public void markApproved() {
        this.status = PendingPaymentStatus.APPROVED;
        this.approvedAt = Instant.now();
    }

    public void recordRetryFailure(String error) {
        this.retryCount++;
        this.lastError = error;
    }
}
