-- 💡 상품 상세 페이지에 노출할 자유 서식 설명. 값이 없던 기존 상품은 NULL로 남아있고,
-- 프론트는 값이 있을 때만 상세 설명 섹션을 보여준다.
ALTER TABLE products ADD COLUMN description text;
