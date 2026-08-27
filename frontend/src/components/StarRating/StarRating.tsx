import styles from './StarRating.module.css';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const STARS = [1, 2, 3, 4, 5];

export const StarRating = ({
  value,
  onChange,
  size = 'md',
}: StarRatingProps) => {
  const interactive = !!onChange;

  return (
    <div
      className={`${styles.stars} ${styles[size]} ${interactive ? styles.interactive : ''}`}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={interactive ? '별점 선택' : `평점 ${value}점`}
    >
      {STARS.map((star) =>
        interactive ? (
          <button
            key={star}
            type="button"
            className={styles.starButton}
            aria-pressed={star <= value}
            aria-label={`${star}점`}
            onClick={() => onChange(star)}
          >
            {star <= value ? '★' : '☆'}
          </button>
        ) : (
          <span key={star} className={styles.star}>
            {star <= Math.round(value) ? '★' : '☆'}
          </span>
        ),
      )}
    </div>
  );
};
