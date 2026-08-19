package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.PendingPaymentStatus;
import lsy.toy.backend.Entity.TossPendingPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TossPendingPaymentRepository extends JpaRepository<TossPendingPayment, Long> {
    Optional<TossPendingPayment> findByOrderId(String orderId);

    // 💡 정합성 배치가 "PG 승인은 됐는데 주문이 안 생긴 채 방치된" 건을 찾을 때 쓴다.
    List<TossPendingPayment> findByStatusAndApprovedAtBefore(PendingPaymentStatus status, Instant threshold);
}
