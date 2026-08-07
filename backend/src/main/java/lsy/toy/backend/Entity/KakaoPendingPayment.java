package lsy.toy.backend.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

    protected KakaoPendingPayment() {
        // JPA
    }

    public KakaoPendingPayment(String tid, String partnerOrderId, Long userId, String requestPayload) {
        this.tid = tid;
        this.partnerOrderId = partnerOrderId;
        this.userId = userId;
        this.requestPayload = requestPayload;
    }

    public Long getId() { return id; }
    public String getTid() { return tid; }
    public String getPartnerOrderId() { return partnerOrderId; }
    public Long getUserId() { return userId; }
    public String getRequestPayload() { return requestPayload; }
    public Instant getCreatedAt() { return createdAt; }
}
