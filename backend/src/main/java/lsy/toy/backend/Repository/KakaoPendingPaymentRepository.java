package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.KakaoPendingPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KakaoPendingPaymentRepository extends JpaRepository<KakaoPendingPayment, Long> {
    Optional<KakaoPendingPayment> findByPartnerOrderId(String partnerOrderId);
}
