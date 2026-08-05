import { useState } from 'react';
import { StarRating } from '../StarRating/StarRating';
import { Button } from '../Button/Button';
import styles from './ReviewForm.module.css';

interface ReviewFormProps {
  initialRating?: number;
  initialContent?: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (rating: number, content: string) => void;
  onCancel?: () => void;
}

export const ReviewForm = ({
  initialRating = 5,
  initialContent = '',
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    onSubmit(rating, content.trim());
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.ratingRow}>
        <span>별점</span>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <textarea
        className={styles.textarea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="상품에 대한 솔직한 후기를 남겨주세요."
        maxLength={1000}
        rows={4}
        required
      />
      <div className={styles.actions}>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
