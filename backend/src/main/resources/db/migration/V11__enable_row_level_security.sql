-- 💡 실제로 DB 레벨에서 강제되는 Row Level Security.
-- 지금까지 Flyway/Hibernate가 접속하던 계정은 테이블 소유자라 RLS를 켜도 정책이 적용되지 않는다.
-- 그래서 런타임 전용 제한된 역할(app_runtime)을 새로 만들고, 백엔드는 이 역할로 접속을 바꿔야 한다
-- (Flyway는 기존 소유자 계정을 spring.flyway.user/password로 계속 사용).
-- 비밀번호는 이 파일에 넣지 않는다 — 마이그레이션 실행 후 직접
--   ALTER ROLE app_runtime WITH PASSWORD '...';
-- 를 한 번 실행하고, application-local.properties의 spring.datasource.password를 그 값으로 바꿀 것.

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
        CREATE ROLE app_runtime LOGIN;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

-- 💡 정책에서 반복해서 쓰는 "현재 요청자" 조회용 헬퍼.
-- 앱이 매 트랜잭션 시작 시 set_config('app.user_id', ...)/('app.user_role', ...)로 채워 넣는다.
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS bigint
    LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.user_id', true), '')::bigint
$$;

CREATE OR REPLACE FUNCTION app_is_admin() RETURNS boolean
    LANGUAGE sql STABLE AS $$
    SELECT current_setting('app.user_role', true) = 'ADMIN'
$$;

-- 💡 로그인/회원가입/토큰 인증(JwtAuthenticationFilter)은 "누가 요청했는지" 알기 전에
-- 이메일로 users를 조회해야 하는 유일한 예외 경로다. users의 RLS 정책("본인 또는 관리자만")은
-- 이 시점엔 항상 거부되므로, 이메일 단건 조회만 가능한 좁은 SECURITY DEFINER 함수로 우회시킨다.
-- (다른 목적의 임의 조회는 여전히 불가능 — 오직 이 함수를 통한 이메일 완전 일치 조회만 허용)
CREATE OR REPLACE FUNCTION app_auth_lookup_user(p_email text) RETURNS SETOF users
    LANGUAGE sql SECURITY DEFINER
    SET search_path = public AS $$
    SELECT * FROM users WHERE email = p_email
$$;

REVOKE ALL ON FUNCTION app_auth_lookup_user(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_auth_lookup_user(text) TO app_runtime;

-- ================= products: 조회는 모두, 쓰기는 관리자만 =================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_all ON products
    FOR SELECT USING (true);

CREATE POLICY products_admin_write ON products
    FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- ================= orders: 주문한 사람 또는 관리자만 =================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_owner_or_admin_select ON orders
    FOR SELECT USING (user_id = app_current_user_id() OR app_is_admin());

CREATE POLICY orders_owner_or_admin_insert ON orders
    FOR INSERT WITH CHECK (user_id = app_current_user_id() OR app_is_admin());

CREATE POLICY orders_owner_or_admin_update ON orders
    FOR UPDATE USING (user_id = app_current_user_id() OR app_is_admin())
    WITH CHECK (user_id = app_current_user_id() OR app_is_admin());

-- 💡 order_items엔 user_id가 없지만(orders에만 있음) Hibernate가 직접 SELECT를 날리므로
-- orders를 잠가도 order_items를 통해 다른 사람의 주문 내역이 그대로 새어나갈 수 있다.
-- orders와 동일한 소유권 기준을 EXISTS로 다시 확인한다.
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_items_owner_or_admin_select ON order_items
    FOR SELECT USING (
        app_is_admin() OR EXISTS (
            SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = app_current_user_id()
        )
    );

CREATE POLICY order_items_owner_or_admin_insert ON order_items
    FOR INSERT WITH CHECK (
        app_is_admin() OR EXISTS (
            SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = app_current_user_id()
        )
    );

-- ================= users: 본인 또는 관리자만 조회/수정 =================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_or_admin_select ON users
    FOR SELECT USING (id = app_current_user_id() OR app_is_admin());

-- 💡 회원가입은 로그인하지 않은 상태(app.user_id 미설정)에서 자기 행을 새로 만드는 것이라
-- app_current_user_id()가 NULL인 경우도 허용해야 한다.
CREATE POLICY users_signup_insert ON users
    FOR INSERT WITH CHECK (app_current_user_id() IS NULL OR app_is_admin());

CREATE POLICY users_self_or_admin_update ON users
    FOR UPDATE USING (id = app_current_user_id() OR app_is_admin())
    WITH CHECK (id = app_current_user_id() OR app_is_admin());

-- ================= reviews: 조회는 모두, 수정/삭제는 작성자(삭제는 관리자도) =================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_select_all ON reviews
    FOR SELECT USING (true);

CREATE POLICY reviews_owner_or_admin_insert ON reviews
    FOR INSERT WITH CHECK (user_id = app_current_user_id() OR app_is_admin());

CREATE POLICY reviews_owner_update ON reviews
    FOR UPDATE USING (user_id = app_current_user_id())
    WITH CHECK (user_id = app_current_user_id());

-- 💡 ReviewController.deleteReview는 작성자 본인뿐 아니라 관리자 삭제도 허용하고 있어(기존 동작),
-- DELETE 정책도 동일하게 맞춘다.
CREATE POLICY reviews_owner_or_admin_delete ON reviews
    FOR DELETE USING (user_id = app_current_user_id() OR app_is_admin());
