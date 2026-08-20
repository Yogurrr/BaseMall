-- 💡 마이페이지 "1:1 문의 내역": 사용자가 작성하고 관리자가 답변하는 문의 게시판.
CREATE TABLE inquiries (
    id           bigserial PRIMARY KEY,
    user_id      bigint NOT NULL REFERENCES users (id),
    order_id     bigint REFERENCES orders (id),
    category     varchar(20) NOT NULL,
    title        varchar(200) NOT NULL,
    content      varchar(2000) NOT NULL,
    image_url    varchar(500),
    status       varchar(20) NOT NULL DEFAULT '답변대기',
    answer       varchar(2000),
    answered_at  timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_user_id ON inquiries (user_id, created_at DESC);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY inquiries_owner_or_admin_select ON inquiries
    FOR SELECT USING (user_id = app_current_user_id() OR app_is_admin());

CREATE POLICY inquiries_owner_or_admin_insert ON inquiries
    FOR INSERT WITH CHECK (user_id = app_current_user_id() OR app_is_admin());

-- 💡 답변 등록(UPDATE)은 관리자만 할 수 있다. 작성자 본인이 제목/내용을 고치는 기능은 없다(삭제 후 재작성).
CREATE POLICY inquiries_admin_update ON inquiries
    FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY inquiries_owner_or_admin_delete ON inquiries
    FOR DELETE USING (user_id = app_current_user_id() OR app_is_admin());
