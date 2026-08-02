package lsy.toy.backend.Repository;

import lsy.toy.backend.Entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // 💡 items는 @OneToMany(EAGER)라 fetch join 없이 조회하면 주문 개수만큼 order_items를
    // 따로 SELECT하는 N+1이 발생한다. JOIN FETCH로 한 쿼리에 묶고, 1:N 조인이 행을 늘리므로
    // DISTINCT로 주문 중복을 제거한다.
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items ORDER BY o.createdAt DESC")
    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.user.id = :userId ORDER BY o.createdAt DESC")
    List<Order> findByUser_IdOrderByCreatedAtDesc(@Param("userId") Long userId);
}
