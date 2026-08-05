package lsy.toy.backend.Dto;

import java.time.Instant;

// 💡 매출 집계 전용 프로젝션. Order 엔티티를 그대로 조회하면 items가 EAGER라 N+1이 발생하므로
// JPQL의 new 표현식으로 필요한 컬럼(금액, 주문일시)만 뽑아온다.
public class OrderRevenueRow {
    private final Integer totalPrice;
    private final Instant createdAt;

    public OrderRevenueRow(Integer totalPrice, Instant createdAt) {
        this.totalPrice = totalPrice;
        this.createdAt = createdAt;
    }

    public Integer getTotalPrice() { return totalPrice; }
    public Instant getCreatedAt() { return createdAt; }
}
