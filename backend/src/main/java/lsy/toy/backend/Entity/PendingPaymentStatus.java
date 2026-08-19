package lsy.toy.backend.Entity;

// 💡 READY: PG 승인 전(ready/prepare만 한 상태). APPROVED: PG 승인은 성공했지만
// 아직 주문(orders row) 생성이 끝나지 않은 상태 - 정합성 배치가 이 상태를 찾아 재처리한다.
public enum PendingPaymentStatus {
    READY,
    APPROVED
}
