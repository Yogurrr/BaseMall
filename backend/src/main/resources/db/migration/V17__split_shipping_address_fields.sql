-- 💡 배송지정보를 받는분/연락처/우편번호/주소/상세주소로 나누고, 공동현관 출입방법을 추가한다.
-- 기존 shipping_address(단일 문자열)는 더 이상 쓰지 않으므로 제거한다 — 과거 주문의 배송지 텍스트는
-- 사라지지만, 아직 서비스 운영 전 단계라 히스토리 보존보다 구조 정리를 우선한다.
ALTER TABLE orders ADD COLUMN recipient_name varchar(50);
ALTER TABLE orders ADD COLUMN recipient_phone varchar(20);
ALTER TABLE orders ADD COLUMN zip_code varchar(10);
ALTER TABLE orders ADD COLUMN address varchar(200);
ALTER TABLE orders ADD COLUMN address_detail varchar(200);
ALTER TABLE orders ADD COLUMN entry_method varchar(20);
ALTER TABLE orders ADD COLUMN entry_note varchar(100);

ALTER TABLE orders DROP COLUMN shipping_address;
