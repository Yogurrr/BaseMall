-- 💡 유니폼 상품의 사이즈/마킹 이름 옵션 지원. 같은 상품이라도 옵션이 다르면
-- 장바구니에서 별도 줄로 취급해야 하므로 (user_id, product_id) 유니크 제약을
-- 옵션까지 포함한 것으로 교체한다.
ALTER TABLE cart_items ADD COLUMN size varchar(20);
ALTER TABLE cart_items ADD COLUMN marking_name varchar(50);

-- 💡 V1 베이스라인에서 이름을 지정하지 않고 만든 유니크 제약이라 실제 이름이
-- Postgres 자동 생성 규칙과 다를 수 있어(supabase 등 환경차) pg_constraint에서 직접 찾아 지운다.
DO $$
DECLARE
    old_constraint_name text;
BEGIN
    SELECT conname INTO old_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'cart_items'::regclass AND contype = 'u'
    LIMIT 1;

    IF old_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE cart_items DROP CONSTRAINT %I', old_constraint_name);
    END IF;
END $$;

ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_id_product_id_size_marking_name_key
    UNIQUE (user_id, product_id, size, marking_name);

-- 💡 주문 시점 스냅샷에도 동일하게 옵션을 남긴다 (배송/제작 시 참조).
ALTER TABLE order_items ADD COLUMN size varchar(20);
ALTER TABLE order_items ADD COLUMN marking_name varchar(50);
