-- 💡 주문/결제 페이지에 배송 요청사항·결제수단·적립금 사용 UI가 추가되면서 필요해진 컬럼들.
-- users.points는 적립금 잔액(사용 시 차감, 주문 완료 시 결제금액의 1% 적립).
ALTER TABLE users ADD COLUMN points integer NOT NULL DEFAULT 0;

ALTER TABLE orders ADD COLUMN delivery_request varchar(200);
ALTER TABLE orders ADD COLUMN payment_method varchar(20);
ALTER TABLE orders ADD COLUMN points_used integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN points_earned integer NOT NULL DEFAULT 0;
