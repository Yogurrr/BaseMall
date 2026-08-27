import { Link } from 'react-router-dom';
import { ProductThumb } from '../ProductThumb/ProductThumb';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import type { MyReview } from '../../types/review';
import styles from './MyReviewListPanel.module.css';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

interface MyReviewListPanelProps {
  reviews: MyReview[];
  emptyMessage: string;
}

export const MyReviewListPanel = ({
  reviews,
  emptyMessage,
}: MyReviewListPanelProps) => {
  if (reviews.length === 0) {
    return (
      <div className={styles.empty}>
        <StatusMessage icon="✍️">{emptyMessage}</StatusMessage>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {reviews.map((review) => (
        <li key={review.id} className={styles.card}>
          <Link to={`/products/${review.productId}`} className={styles.thumb}>
            <ProductThumb
              imageUrl={review.productImageUrl}
              alt={review.productName}
              size="lg"
            />
          </Link>
          <div className={styles.info}>
            <Link
              to={`/products/${review.productId}`}
              className={styles.productName}
            >
              {review.productName}
            </Link>
            <p className={styles.rating}>
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </p>
            <p className={styles.content}>{review.content}</p>
            <p className={styles.meta}>{formatDate(review.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};
