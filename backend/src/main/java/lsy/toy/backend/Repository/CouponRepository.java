package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findByUser_IdOrderByIssuedAtDesc(Long userId);

    Optional<Coupon> findByIdAndUser_Id(Long id, Long userId);

    boolean existsByUser_IdAndGradeAndUsedAtIsNull(Long userId, String grade);
}
