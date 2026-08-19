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

    // 💡 리뷰 작성 자격 검증용 - 주문취소가 아닌 주문으로 해당 상품을 구매한 적이 있는지 확인한다.
    boolean existsByProductIdAndOrder_User_IdAndOrder_StatusNot(Long productId, Long userId, String status);

    // 💡 마이페이지 "리뷰 쓰러가기" 목록용 - 주문취소가 아닌 주문으로 구매했지만 아직 리뷰를 쓰지 않은 상품의 주문 항목을 최신순으로 찾는다.
    // 같은 상품을 여러 주문에서 샀다면 여러 건이 나오므로, 상품별로 최신 한 건만 남기는 중복 제거는 Service에서 처리한다.
    @Query("""
        SELECT oi FROM OrderItem oi
        JOIN FETCH oi.order o
        WHERE o.user.id = :userId AND o.status <> '주문취소'
          AND oi.productId NOT IN (SELECT r.product.id FROM Review r WHERE r.user.id = :userId)
        ORDER BY o.createdAt DESC
        """)
    List<OrderItem> findReviewableItemsByUserId(@Param("userId") Long userId);
}
