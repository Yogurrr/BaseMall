-- 💡 cart_items/wishlist_items(V1)와 coupons(V10)는 V11에서 RLS를 도입할 때 빠져 있었다.
-- app_runtime은 V11에서 이미 전체 테이블에 SELECT/INSERT/UPDATE/DELETE 권한을 받았으므로,
-- 이 정책들이 없으면 Service 계층의 findByUser_Id... 필터링에만 의존하게 되어
-- 그 필터링에 버그가 하나만 생겨도 DB 레벨 방어 없이 다른 사용자 데이터가 그대로 샌다.

-- ================= cart_items: 본인 장바구니만, 시딩 관리자 컨텍스트는 예외 =================
-- 💡 DataSeeder.run()이 스키마 드리프트 감지 시 cartItemRepository.deleteAll()을 호출하는데,
-- 이때는 로그인 요청이 아니라 app.user_role만 'ADMIN'으로 채워두고 app.user_id는 비워둔다
-- (DataSeeder 90행 주석 참고). app_is_admin() 예외가 없으면 이 삭제가 조용히 0건 처리되어
-- 재시딩이 실패한다.
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY cart_items_owner_or_admin_all ON cart_items
    FOR ALL USING (user_id = app_current_user_id() OR app_is_admin())
    WITH CHECK (user_id = app_current_user_id() OR app_is_admin());

-- ================= wishlist_items: 본인 위시리스트만, 관리자 컨텍스트는 예외 =================
-- 💡 지금은 admin이 위시리스트를 직접 건드리는 기능이 없지만, cart_items와 같은 이유로
-- 향후 시딩/배치가 이 테이블을 건드릴 때 조용히 막히지 않도록 동일하게 예외를 둔다.
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY wishlist_items_owner_or_admin_all ON wishlist_items
    FOR ALL USING (user_id = app_current_user_id() OR app_is_admin())
    WITH CHECK (user_id = app_current_user_id() OR app_is_admin());

-- ================= coupons: 조회/사용은 본인만, 발급은 관리자만 =================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY coupons_owner_select ON coupons
    FOR SELECT USING (user_id = app_current_user_id());

-- 💡 CouponService.issueByGrade()는 관리자가 다른 회원(user_id) 앞으로 쿠폰을 만드는 것이라
-- app_current_user_id()(관리자 자신)와 쿠폰의 user_id가 서로 다르다. 그래서 이 체크는 소유권이
-- 아니라 app_is_admin() 하나만 확인한다.
CREATE POLICY coupons_admin_insert ON coupons
    FOR INSERT WITH CHECK (app_is_admin());

-- 💡 쿠폰 사용 처리(OrderService, 체크아웃 시 used_at/order_id 갱신)는 본인 요청으로만 일어나고
-- 관리자가 남의 쿠폰을 대신 사용 처리하는 경로는 없다.
CREATE POLICY coupons_owner_update ON coupons
    FOR UPDATE USING (user_id = app_current_user_id())
    WITH CHECK (user_id = app_current_user_id());
