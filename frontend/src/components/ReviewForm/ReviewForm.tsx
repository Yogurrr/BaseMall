import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StarRating } from '../StarRating/StarRating';
import { Button } from '../Button/Button';
import styles from './ReviewForm.module.css';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().trim().min(1, '리뷰 내용을 입력해주세요.'),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

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
  const { control, register, handleSubmit } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: initialRating, content: initialContent },
  });

  const submit = (values: ReviewFormValues) => {
    onSubmit(values.rating, values.content.trim());
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(submit)} noValidate>
      <div className={styles.ratingRow}>
        <span>별점</span>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarRating
              value={field.value}
              onChange={field.onChange}
              size="lg"
            />
          )}
        />
      </div>
      <textarea
        className={styles.textarea}
        {...register('content')}
        placeholder="상품에 대한 솔직한 후기를 남겨주세요."
        maxLength={1000}
        rows={4}
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
