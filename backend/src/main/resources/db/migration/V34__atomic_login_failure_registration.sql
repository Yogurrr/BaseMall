-- 💡 기존 app_auth_update_login_state는 애플리케이션이 "이전 실패 횟수를 읽어 +1한 절대값"을
-- 전달받아 그대로 SET하는 방식이었다. 동시에 같은 계정으로 로그인 실패가 두 번 들어오면 둘 다
-- 같은 이전 값을 읽어 같은 값으로 덮어써버려(lost update) 실패 횟수가 유실되고, 브루트포스
-- 잠금 임계값 도달이 늦어지거나 회피될 수 있었다. 증가/잠금 판정을 단일 UPDATE 문 안에서
-- 수행하면 Postgres가 같은 row에 대한 UPDATE를 행 잠금으로 직렬화해주므로 lost update가
-- 구조적으로 발생하지 않는다.
CREATE OR REPLACE FUNCTION app_auth_register_login_failure(
    p_email text,
    p_now timestamptz,
    p_max_attempts int,
    p_lockout_seconds int
) RETURNS TABLE(failed_login_attempts int, locked_until timestamptz)
    LANGUAGE sql SECURITY DEFINER
    SET search_path = public AS $$
    UPDATE users
    SET failed_login_attempts = CASE
            WHEN locked_until IS NOT NULL AND locked_until <= p_now THEN 1
            ELSE users.failed_login_attempts + 1
        END,
        locked_until = CASE
            WHEN (CASE
                    WHEN locked_until IS NOT NULL AND locked_until <= p_now THEN 1
                    ELSE users.failed_login_attempts + 1
                END) >= p_max_attempts
                THEN p_now + make_interval(secs => p_lockout_seconds)
            ELSE NULL
        END
    WHERE email = p_email
    RETURNING users.failed_login_attempts, users.locked_until;
$$;

REVOKE ALL ON FUNCTION app_auth_register_login_failure(text, timestamptz, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_auth_register_login_failure(text, timestamptz, int, int) TO app_runtime;
