-- 💡 액세스 토큰(메모리 보관, 짧은 수명)과 분리된 리프레시 토큰(httpOnly 쿠키, 긴 수명) 저장소.
-- recent_view_items와 마찬가지로 관리자가 남의 토큰 해시를 볼 이유가 없는 순수 인증 데이터라 owner-only로 잠근다.
-- email은 users.email과 중복 저장이지만, 로그인 전(app_auth_lookup_user와 동일한 상황) 토큰 해시로
-- 신원을 확인한 직후 기존 app_auth_lookup_user(email)를 그대로 재사용하기 위한 것 — 이메일은
-- 가입 후 변경 불가(AuthService.updateProfile 참고)라 드리프트 걱정이 없다.
CREATE TABLE refresh_tokens (
    id         bigserial PRIMARY KEY,
    user_id    bigint NOT NULL REFERENCES users (id),
    email      text NOT NULL,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY refresh_tokens_owner_only ON refresh_tokens
    FOR ALL USING (user_id = app_current_user_id())
    WITH CHECK (user_id = app_current_user_id());

-- 💡 리프레시 시점엔 아직 SecurityContext가 없어(Authorization 헤더가 아니라 쿠키로 신원을 확인하는 경로)
-- owner-only 정책을 통과할 수 없다. app_auth_lookup_user와 동일하게 정확히 해시 완전 일치 조회만
-- 허용하는 좁은 SECURITY DEFINER 함수로 우회시킨다.
CREATE OR REPLACE FUNCTION app_auth_lookup_refresh_token(p_token_hash text) RETURNS SETOF refresh_tokens
    LANGUAGE sql SECURITY DEFINER
    SET search_path = public AS $$
    SELECT * FROM refresh_tokens WHERE token_hash = p_token_hash
$$;

REVOKE ALL ON FUNCTION app_auth_lookup_refresh_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_auth_lookup_refresh_token(text) TO app_runtime;
