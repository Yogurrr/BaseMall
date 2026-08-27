-- 💡 로그인 무차별 대입(브루트포스) 방지: 계정별 연속 실패 횟수와 잠금 만료 시각을 저장한다.
ALTER TABLE users ADD COLUMN failed_login_attempts int NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until timestamptz;

-- 💡 로그인 성공/실패마다 이 값을 갱신해야 하는데, 그 시점엔 아직 인증되지 않아
-- users_self_or_admin_update RLS 정책(id = app_current_user_id())을 통과하지 못한다.
-- app_auth_lookup_user와 동일한 이유로, 이메일 단건 UPDATE만 가능한 좁은 SECURITY DEFINER
-- 함수로 우회시킨다 (다른 컬럼은 손댈 수 없고 오직 이 두 컬럼만 갱신).
CREATE OR REPLACE FUNCTION app_auth_update_login_state(p_email text, p_failed_attempts int, p_locked_until timestamptz) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path = public AS $$
    UPDATE users SET failed_login_attempts = p_failed_attempts, locked_until = p_locked_until WHERE email = p_email
$$;

REVOKE ALL ON FUNCTION app_auth_update_login_state(text, int, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_auth_update_login_state(text, int, timestamptz) TO app_runtime;
