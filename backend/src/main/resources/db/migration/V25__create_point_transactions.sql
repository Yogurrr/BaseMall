-- 💡 적립금 잔액(users.points)이 왜 바뀌었는지에 대한 이력. 지금까지는 이력 테이블이 없어
-- 마이페이지 적립금 내역을 주문 목록(pointsUsed/pointsEarned)에서 매번 재구성했는데,
-- 리뷰 작성 적립처럼 주문과 무관한 변동이 생기면서 더 이상 그 방식으로 감당이 안 돼 테이블을 새로 둔다.
CREATE TABLE point_transactions (
    id          bigserial PRIMARY KEY,
    user_id     bigint NOT NULL REFERENCES users (id),
    amount      integer NOT NULL,
    type        varchar(30) NOT NULL,
    order_id    bigint REFERENCES orders (id),
    -- 💡 리뷰는 작성자 본인이 하드 삭제할 수 있어(ReviewService.deleteReview), 삭제돼도 이력 행 자체는
    -- 남아야 하므로 review_id만 SET NULL로 끊는다 (order는 하드 삭제 경로가 없어 그대로 둬도 안전).
    review_id   bigint REFERENCES reviews (id) ON DELETE SET NULL,
    description varchar(200) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_point_transactions_user_id ON point_transactions (user_id, created_at DESC);

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY point_transactions_owner_or_admin_select ON point_transactions
    FOR SELECT USING (user_id = app_current_user_id() OR app_is_admin());

-- 💡 관리자가 주문을 취소 처리할 때도 그 주문 소유자 명의로 회수 이력이 남아야 하므로
-- user_id가 아니라 app_is_admin()으로도 INSERT를 허용한다 (orders_owner_or_admin_insert와 동일 패턴).
CREATE POLICY point_transactions_owner_or_admin_insert ON point_transactions
    FOR INSERT WITH CHECK (user_id = app_current_user_id() OR app_is_admin());
