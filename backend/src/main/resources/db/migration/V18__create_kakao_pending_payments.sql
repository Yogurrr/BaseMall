-- 💡 카카오페이 결제 준비(ready)~승인(approve) 사이, 카카오 결제창으로 리다이렉트되었다 돌아오는 동안
-- 주문 생성에 필요한 정보(CreateOrderRequest)를 잠시 들고 있어야 해서 만든 임시 테이블.
-- 승인 완료 시 실제 orders row가 생기면서 이 row는 삭제된다.
CREATE TABLE kakao_pending_payments (
    id bigserial PRIMARY KEY,
    tid varchar(50) NOT NULL,
    partner_order_id varchar(50) NOT NULL UNIQUE,
    user_id bigint NOT NULL REFERENCES users(id),
    request_payload text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kakao_pending_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY kakao_pending_payments_owner_or_admin ON kakao_pending_payments
    FOR ALL USING (user_id = app_current_user_id() OR app_is_admin())
    WITH CHECK (user_id = app_current_user_id() OR app_is_admin());
