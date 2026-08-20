package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
