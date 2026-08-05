-- 💡 DataSeeder가 데모용으로 박아뒀던 평점/리뷰 개수는 실제 리뷰(reviews 테이블)와 무관한 값이었다.
-- 리뷰 기능이 생긴 이후로는 이 값이 실제 리뷰 통계여야 하므로, 리뷰가 없는 초기 상태에 맞게 0으로 되돌린다.
-- (실제로 리뷰가 달린 상품은 ReviewService가 리뷰 작성/수정/삭제 시점에 다시 정확한 값으로 갱신한다.)
UPDATE products SET rating = 0, review_count = 0;
