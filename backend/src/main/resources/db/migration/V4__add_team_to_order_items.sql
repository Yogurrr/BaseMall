-- 💡 매출 통계에서 구단별 집계를 위해 주문 시점 구단명 스냅샷을 추가한다.
-- (category처럼 Product를 참조하지 않고 문자열로만 저장 — 상품/구단이 나중에 바뀌어도 과거 주문은 그대로 남는다)
ALTER TABLE order_items ADD COLUMN team varchar(255);
