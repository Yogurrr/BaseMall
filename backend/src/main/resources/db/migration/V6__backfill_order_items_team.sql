-- 💡 V4에서 order_items.team 컬럼을 추가하기 전에 만들어진 주문은 team이 NULL로 남아
-- 매출 통계(구단별 매출)에서 "기타"로 잡혔다. 상품명으로 products/teams를 매칭해 채워 넣는다.
-- (product_id FK가 없는 스냅샷 컬럼이라 이름으로 매칭 — 신규 DB에는 해당하는 행이 없어 아무 영향 없음)
UPDATE order_items oi
SET team = t.name
FROM products p
JOIN teams t ON t.id = p.team_id
WHERE oi.team IS NULL
  AND oi.product_name = p.name;
