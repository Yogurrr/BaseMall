-- 💡 PG 승인은 성공했는데 뒤이은 주문 생성이 실패해 "결제는 됐지만 주문은 없는" 상태로
-- 남는 경우를 배치가 찾아 재시도/자동환불 처리할 수 있도록, pending 결제에 상태와
-- 재시도 이력을 추가한다. status가 APPROVED로 바뀌는 시점(approved_at)부터를 기준으로
-- 정합성 배치가 대상을 골라낸다.
ALTER TABLE kakao_pending_payments
    ADD COLUMN status varchar(20) NOT NULL DEFAULT 'READY',
    ADD COLUMN amount integer,
    ADD COLUMN approved_at timestamptz,
    ADD COLUMN retry_count integer NOT NULL DEFAULT 0,
    ADD COLUMN last_error text;

ALTER TABLE toss_pending_payments
    ADD COLUMN status varchar(20) NOT NULL DEFAULT 'READY',
    ADD COLUMN payment_key varchar(200),
    ADD COLUMN approved_at timestamptz,
    ADD COLUMN retry_count integer NOT NULL DEFAULT 0,
    ADD COLUMN last_error text;
