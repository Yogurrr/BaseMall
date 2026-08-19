-- 💡 리뷰 작성 시 "실제 구매자인지" 검증하려면 상품 ID로 주문 내역을 조회할 수 있어야 한다.
-- order_items는 표시용 스냅샷이라 product_id가 없었는데(V6 참고), 구매 검증 전용으로 추가한다.
-- products는 소프트 삭제만 하므로(useAt) FK로 걸어도 안전하다.
ALTER TABLE order_items ADD COLUMN product_id bigint REFERENCES products(id);

-- 기존 주문은 상품명으로 최선 매칭 (V6과 동일한 방식 — 이름이 겹치면 매칭되지 않을 수 있음)
UPDATE order_items oi
SET product_id = p.id
FROM products p
WHERE oi.product_id IS NULL
  AND oi.product_name = p.name;
