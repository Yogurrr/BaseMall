-- 💡 관리자 통계(신규 가입자/탈퇴 회원)를 위해 가입일과 소프트 삭제 상태를 추가한다.
-- 기존 회원 탈퇴는 실제 DELETE였는데, 탈퇴 이력이 전혀 남지 않는 데다
-- orders/wishlist_items에 FK가 남아 있는 회원은 탈퇴 시 제약 위반으로 실패하는 잠재 버그가 있었다.
-- products와 동일한 use_at(Y/N) 패턴으로 소프트 삭제로 전환한다.
ALTER TABLE users ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN use_at varchar(1) NOT NULL DEFAULT 'Y';
ALTER TABLE users ADD COLUMN withdrawn_at timestamptz;
