import { useQuery } from '@tanstack/react-query';
import { MyReviewListPanel } from '../../components/MyReviewListPanel/MyReviewListPanel';
import { ReviewableItemPanel } from '../../components/ReviewableItemPanel/ReviewableItemPanel';
import { fetchMyReviews, fetchReviewableItems } from '../../api/reviewApi';
import styles from './MyPage.module.css';

export const MyPageReviews = () => {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', 'me'],
    queryFn: fetchMyReviews,
  });
  const { data: reviewableItems = [] } = useQuery({
    queryKey: ['reviews', 'me', 'reviewable'],
    queryFn: fetchReviewableItems,
  });

  return (
    <div className={styles.wishlistSection}>
      <ReviewableItemPanel items={reviewableItems} />

      <p className={styles.comingSoonTitle}>내가 쓴 리뷰 {reviews.length}건</p>
      <MyReviewListPanel
        reviews={reviews}
        emptyMessage="작성한 리뷰가 없습니다."
      />
    </div>
  );
};
