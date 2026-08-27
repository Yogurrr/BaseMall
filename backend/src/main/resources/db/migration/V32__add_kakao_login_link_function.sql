-- 💡 카카오 로그인 시 기존 계정(이메일 일치)에 카카오 토큰을 연동하는 경로. 로그인 자체를
-- 처리하는 중이라 아직 인증되지 않은 상태라, 일반 save()는 users_self_or_admin_update RLS
-- 정책에 막힌다. app_auth_update_login_state(V29/V30)와 동일한 이유로 SECURITY DEFINER
-- 함수를 통해서만 갱신하고, RETURNS integer + SELECT 1로 맞춰 executeUpdate 오류(V30 참고)를 피한다.
CREATE OR REPLACE FUNCTION app_auth_link_kakao_account(
    p_email text, p_kakao_id bigint, p_access_token text, p_refresh_token text, p_expires_at timestamptz
) RETURNS integer
    LANGUAGE sql SECURITY DEFINER
    SET search_path = public AS $$
    UPDATE users SET kakao_id = p_kakao_id, kakao_access_token = p_access_token,
        kakao_refresh_token = p_refresh_token, kakao_token_expires_at = p_expires_at
    WHERE email = p_email;
    SELECT 1;
$$;

REVOKE ALL ON FUNCTION app_auth_link_kakao_account(text, bigint, text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_auth_link_kakao_account(text, bigint, text, text, timestamptz) TO app_runtime;
