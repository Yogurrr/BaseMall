package lsy.toy.backend.Repository;

import lsy.toy.backend.Dto.OrderItemRevenueRow;
import lsy.toy.backend.Entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // 💡 기간별 구단/품목 매출 집계용. 주문취소는 제외하고, 주문 항목 단가·수량·구단·카테고리만 뽑아온다.
    @Query("""
        SELECT new lsy.toy.backend.Dto.OrderItemRevenueRow(oi.team, oi.category, oi.unitPrice, oi.quantity)
        FROM OrderItem oi
        JOIN oi.order o
        WHERE o.status <> '주문취소' AND o.createdAt >= :from AND o.createdAt < :to
        """)
    List<OrderItemRevenueRow> findRevenueRowsBetween(@Param("from") Instant from, @Param("to") Instant to);
}
