-- 💡 상품 Q&A. 리뷰(reviews)처럼 상품에 달리지만, 문의(inquiries)처럼 관리자가 답변하는 구조다.
CREATE TABLE product_qna (
    id          bigserial PRIMARY KEY,
    product_id  bigint NOT NULL REFERENCES products (id),
    user_id     bigint NOT NULL REFERENCES users (id),
    question    varchar(1000) NOT NULL,
    status      varchar(20) NOT NULL DEFAULT '답변대기',
    answer      varchar(1000),
    answered_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_qna_product_id ON product_qna (product_id, created_at DESC);
CREATE INDEX idx_product_qna_user_id ON product_qna (user_id, created_at DESC);

ALTER TABLE product_qna ENABLE ROW LEVEL SECURITY;

-- 💡 상품 Q&A는 리뷰처럼 구매 전 고객도 볼 수 있어야 하는 공개 게시판이라 전체 공개로 둔다.
CREATE POLICY product_qna_select_all ON product_qna
    FOR SELECT USING (true);

CREATE POLICY product_qna_owner_or_admin_insert ON product_qna
    FOR INSERT WITH CHECK (user_id = app_current_user_id() OR app_is_admin());

-- 💡 답변 등록(UPDATE)은 관리자만 할 수 있다. 작성자 본인이 질문 내용을 고치는 기능은 없다(삭제 후 재작성).
CREATE POLICY product_qna_admin_update ON product_qna
    FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY product_qna_owner_or_admin_delete ON product_qna
    FOR DELETE USING (user_id = app_current_user_id() OR app_is_admin());
