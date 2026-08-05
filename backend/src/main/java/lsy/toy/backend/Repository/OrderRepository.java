package lsy.toy.backend.Repository;

import lsy.toy.backend.Dto.OrderRevenueRow;
import lsy.toy.backend.Dto.UserSpendRow;
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

    // 💡 매출 집계용. 주문취소는 매출에서 제외하고, 필요한 컬럼만 뽑아 items N+1을 피한다.
    @Query("SELECT new lsy.toy.backend.Dto.OrderRevenueRow(o.totalPrice, o.createdAt) FROM Order o WHERE o.status <> '주문취소'")
    List<OrderRevenueRow> findRevenueRows();

    // 💡 회원 등급(구매금액 기준) 집계용. 주문이 없는 회원은 결과에 아예 없으므로
    // 호출부에서 회원 목록과 합쳐 0원으로 채워야 한다.
    @Query("SELECT new lsy.toy.backend.Dto.UserSpendRow(o.user.id, SUM(o.totalPrice)) FROM Order o WHERE o.status <> '주문취소' GROUP BY o.user.id")
    List<UserSpendRow> findSpendByUser();

    // 💡 개별 회원의 등급 계산용 (마이페이지). 주문이 없으면 null이 반환되므로 호출부에서 0 처리한다.
    @Query("SELECT SUM(o.totalPrice) FROM Order o WHERE o.status <> '주문취소' AND o.user.id = :userId")
    Long sumSpendByUserId(@Param("userId") Long userId);
}
