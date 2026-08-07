-- 💡 토스페이먼츠 결제 준비(prepare)~승인(confirm) 사이, 결제위젯에서 결제를 진행하는 동안
-- 주문 생성에 필요한 정보(CreateOrderRequest)와 청구 금액을 잠시 들고 있어야 해서 만든 임시 테이블.
-- 승인 완료 시 실제 orders row가 생기면서 이 row는 삭제된다.
CREATE TABLE toss_pending_payments (
    id bigserial PRIMARY KEY,
    order_id varchar(64) NOT NULL UNIQUE,
    user_id bigint NOT NULL REFERENCES users(id),
    amount integer NOT NULL,
    request_payload text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE toss_pending_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY toss_pending_payments_owner_or_admin ON toss_pending_payments
    FOR ALL USING (user_id = app_current_user_id() OR app_is_admin())
    WITH CHECK (user_id = app_current_user_id() OR app_is_admin());
