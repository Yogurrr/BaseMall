-- 💡 V29의 app_auth_update_login_state는 RETURNS void였는데, JDBC(PgPreparedStatement)로
-- "SELECT app_auth_update_login_state(...)"를 executeUpdate()로 호출하면 "A result was
-- returned when none was expected" 예외가 난다 — void 함수라도 SELECT로 호출하면 항상
-- 결과 행(1행 1열)이 돌아오기 때문. RETURNS integer로 바꿔 Repository 쪽에서 @Modifying 없이
-- 일반 조회(executeQuery)로 호출하도록 맞춘다. CREATE OR REPLACE는 반환 타입 변경을 허용하지
-- 않으므로 먼저 DROP한다.
DROP FUNCTION IF EXISTS app_auth_update_login_state(text, int, timestamptz);

CREATE OR REPLACE FUNCTION app_auth_update_login_state(p_email text, p_failed_attempts int, p_locked_until timestamptz) RETURNS integer
    LANGUAGE sql SECURITY DEFINER
    SET search_path = public AS $$
    UPDATE users SET failed_login_attempts = p_failed_attempts, locked_until = p_locked_until WHERE email = p_email;
    SELECT 1;
$$;

REVOKE ALL ON FUNCTION app_auth_update_login_state(text, int, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_auth_update_login_state(text, int, timestamptz) TO app_runtime;
