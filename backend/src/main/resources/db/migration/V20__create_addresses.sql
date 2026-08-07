-- 💡 주문/결제 화면에서 자주 쓰는 배송지를 저장해두고 다음 주문 때 목록에서 골라 자동입력할 수 있게 하는
-- 배송지록. orders의 배송지 필드(받는분/연락처/우편번호/주소/상세주소)와 같은 구성에, 여러 개 중 하나를
-- 구분할 별칭(label)과 기본 배송지 여부(is_default)만 추가한다.
CREATE TABLE addresses (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    label varchar(20),
    recipient_name varchar(50) NOT NULL,
    recipient_phone varchar(20) NOT NULL,
    zip_code varchar(10) NOT NULL,
    address varchar(200) NOT NULL,
    address_detail varchar(200),
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 💡 배송지록은 orders와 달리 관리자가 들여다볼 이유가 없는 순수 개인 데이터라 owner-only로 잠근다.
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY addresses_owner_only ON addresses
    FOR ALL USING (user_id = app_current_user_id())
    WITH CHECK (user_id = app_current_user_id());
