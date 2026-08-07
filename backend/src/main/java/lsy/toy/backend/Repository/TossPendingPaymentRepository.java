package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.TossPendingPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TossPendingPaymentRepository extends JpaRepository<TossPendingPayment, Long> {
    Optional<TossPendingPayment> findByOrderId(String orderId);
}
