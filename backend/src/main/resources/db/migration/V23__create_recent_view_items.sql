-- 💡 상품 상세를 볼 때마다 기록되는 최근 본 상품 이력. 같은 상품을 다시 보면 새 행을 쌓지 않고
-- viewed_at만 갱신해 목록 맨 앞으로 올라오게 하므로, 위시리스트처럼 (user_id, product_id) 유니크로 잠근다.
CREATE TABLE recent_view_items (
    id         bigserial PRIMARY KEY,
    user_id    bigint NOT NULL REFERENCES users (id),
    product_id bigint NOT NULL REFERENCES products (id),
    viewed_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

-- 💡 최근 본 상품 이력도 addresses와 마찬가지로 관리자가 볼 이유가 없는 순수 개인 데이터라 owner-only로 잠근다.
ALTER TABLE recent_view_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY recent_view_items_owner_only ON recent_view_items
    FOR ALL USING (user_id = app_current_user_id())
    WITH CHECK (user_id = app_current_user_id());
