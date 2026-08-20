import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { isLoggedIn } from '../../api/authToken';
import { createReview, deleteReview, fetchReviews, updateReview } from '../../api/reviewApi';
import { ReviewForm } from '../ReviewForm/ReviewForm';
import { ReviewList } from '../ReviewList/ReviewList';
import { Spinner } from '../Spinner/Spinner';
import styles from './ProductReviews.module.css';

interface ProductReviewsProps {
  productId: number;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const {
    data: reviews = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => fetchReviews(productId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };

  const createMutation = useMutation({
    mutationFn: ({ rating, content }: { rating: number; content: string }) => createReview(productId, rating, content),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, rating, content }: { reviewId: number; rating: number; content: string }) =>
      updateReview(productId, reviewId, rating, content),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => deleteReview(productId, reviewId),
    onSuccess: invalidate,
  });

  const myReview = reviews.find((review) => review.userId === currentUser?.id);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>리뷰 {reviews.length > 0 && `(${reviews.length})`}</h2>

      {isLoading ? (
        <div className={styles.empty}><Spinner /></div>
      ) : isError ? (
        <p className={styles.error}>리뷰를 불러오지 못했습니다.</p>
      ) : (
        <>
          {!isLoggedIn() && <p className={styles.notice}>로그인 후 리뷰를 작성할 수 있습니다.</p>}

          {isLoggedIn() && !myReview && (
            <>
              <p className={styles.notice}>리뷰를 작성하면 적립금 500원이 지급됩니다.</p>
              <ReviewForm
                submitLabel="리뷰 등록"
                isSubmitting={createMutation.isPending}
                onSubmit={(rating, content) => createMutation.mutate({ rating, content })}
              />
            </>
          )}

          {createMutation.isError && (
            <p className={styles.error}>
              {axios.isAxiosError(createMutation.error) && createMutation.error.response?.data?.message
                ? createMutation.error.response.data.message
                : '리뷰 등록에 실패했습니다.'}
            </p>
          )}

          <ReviewList
            reviews={reviews}
            currentUserId={currentUser?.id}
            isAdmin={currentUser?.role === 'ADMIN'}
            isSaving={updateMutation.isPending}
            onUpdate={(reviewId, rating, content) => updateMutation.mutate({ reviewId, rating, content })}
            onDelete={(reviewId) => {
              if (window.confirm('리뷰를 삭제하시겠습니까?')) {
                deleteMutation.mutate(reviewId);
              }
            }}
          />
        </>
      )}
    </section>
  );
};
