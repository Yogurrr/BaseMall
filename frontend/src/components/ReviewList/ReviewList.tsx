import { useState } from 'react';
import type { Review } from '../../types/review';
import { StarRating } from '../StarRating/StarRating';
import { ReviewForm } from '../ReviewForm/ReviewForm';
import { Button } from '../Button/Button';
import styles from './ReviewList.module.css';

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: number;
  isAdmin?: boolean;
  isSaving?: boolean;
  onUpdate: (reviewId: number, rating: number, content: string) => void;
  onDelete: (reviewId: number) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export const ReviewList = ({
  reviews,
  currentUserId,
  isAdmin,
  isSaving,
  onUpdate,
  onDelete,
}: ReviewListProps) => {
  const [editingId, setEditingId] = useState<number | null>(null);

  if (reviews.length === 0) {
    return (
      <p className={styles.empty}>
        아직 작성된 리뷰가 없습니다. 첫 리뷰를 남겨보세요!
      </p>
    );
  }

  return (
    <ul className={styles.list}>
      {reviews.map((review) => {
        const isOwner = review.userId === currentUserId;
        const isEditing = editingId === review.id;

        return (
          <li key={review.id} className={styles.item}>
            {isEditing ? (
              <ReviewForm
                initialRating={review.rating}
                initialContent={review.content}
                submitLabel="수정 완료"
                isSubmitting={isSaving}
                onCancel={() => setEditingId(null)}
                onSubmit={(rating, content) => {
                  onUpdate(review.id, rating, content);
                  setEditingId(null);
                }}
              />
            ) : (
              <>
                <div className={styles.header}>
                  <div className={styles.headerLeft}>
                    <span className={styles.userName}>{review.userName}</span>
                    <StarRating value={review.rating} size="sm" />
                  </div>
                  <span className={styles.date}>
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className={styles.content}>{review.content}</p>
                {(isOwner || isAdmin) && (
                  <div className={styles.actions}>
                    {isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(review.id)}
                      >
                        수정
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(review.id)}
                    >
                      삭제
                    </Button>
                  </div>
                )}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
};
