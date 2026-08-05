-- 💡 상세 설명(description)에 곁들이는 이미지. 상품 카드/썸네일에 쓰는 image_url과는
-- 별개 컬럼이라, 상세 이미지만 따로 없거나 바꿔도 목록/썸네일에는 영향이 없다.
ALTER TABLE products ADD COLUMN detail_image_url varchar(500);
