-- 💡 카카오 "나에게 보내기" 알림 연동용. 계정을 연동하지 않은 회원은 전부 null이며,
-- 컬럼만 추가하는 것이라 users에 이미 걸려 있는 RLS 정책(V11)을 그대로 따른다.
ALTER TABLE users ADD COLUMN kakao_id bigint;
ALTER TABLE users ADD COLUMN kakao_access_token text;
ALTER TABLE users ADD COLUMN kakao_refresh_token text;
ALTER TABLE users ADD COLUMN kakao_token_expires_at timestamptz;
