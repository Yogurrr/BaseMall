import { useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '../Button/Button';
import { answerQna, fetchAllQnas } from '../../api/qnaApi';
import type { AdminQna } from '../../types/qna';
import { formatDateTime } from '../../utils/formatDate';
import styles from './QnaDetailModal.module.css';

const answerSchema = z.object({
  answer: z.string().trim().min(1, '답변을 입력해주세요.').max(1000),
});

type AnswerFormValues = z.infer<typeof answerSchema>;

interface QnaDetailModalProps {
  qna: AdminQna;
  onClose: () => void;
}

export const QnaDetailModal = ({ qna, onClose }: QnaDetailModalProps) => {
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState(qna);

  const { register, handleSubmit } = useForm<AnswerFormValues>({
    resolver: zodResolver(answerSchema),
    defaultValues: { answer: '' },
  });

  const answerMutation = useMutation({
    mutationFn: (answer: string) => answerQna(current.id, answer),
    onSuccess: (updated) => {
      setCurrent(updated);
      queryClient.invalidateQueries({ queryKey: ['qna', 'admin'] });
    },
    onError: async (error) => {
      // 💡 다른 관리자가 먼저 답변을 등록해 409(이미 답변완료)가 오는 동시성 케이스.
      // 목록을 다시 받아와 current를 최신화하면 폼이 답변 표시로 자동 전환된다.
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const all = await fetchAllQnas();
        const fresh = all.find((item) => item.id === current.id);
        if (fresh) setCurrent(fresh);
        queryClient.invalidateQueries({ queryKey: ['qna', 'admin'] });
      }
    },
  });

  const onAnswerSubmit = (values: AnswerFormValues) => {
    answerMutation.mutate(values.answer);
  };

  const onAnswerInvalid = (formErrors: FieldErrors<AnswerFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;
    toast.error(
      typeof firstMessage === 'string'
        ? firstMessage
        : '입력값을 확인해주세요.',
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qna-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="qna-detail-title">{current.productName}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <dl className={styles.infoGrid}>
          <dt>상태</dt>
          <dd>{current.status}</dd>
          <dt>작성일</dt>
          <dd>{formatDateTime(current.createdAt)}</dd>
          <dt>작성자</dt>
          <dd>
            {current.authorName} ({current.authorEmail})
          </dd>
        </dl>

        <p className={styles.content}>{current.question}</p>

        <div className={styles.answerSection}>
          <h3>답변</h3>
          {current.answer ? (
            <>
              <p className={styles.content}>{current.answer}</p>
              {current.answeredAt && (
                <p className={styles.answeredAt}>
                  {formatDateTime(current.answeredAt)}
                </p>
              )}
            </>
          ) : (
            <form
              className={styles.answerForm}
              onSubmit={handleSubmit(onAnswerSubmit, onAnswerInvalid)}
              noValidate
            >
              <textarea
                className={styles.textarea}
                {...register('answer')}
                placeholder="답변을 입력해주세요."
                maxLength={1000}
                rows={4}
              />
              {answerMutation.isError && (
                <p className={styles.error}>
                  {axios.isAxiosError(answerMutation.error) &&
                  answerMutation.error.response?.data?.message
                    ? answerMutation.error.response.data.message
                    : '답변 등록에 실패했습니다.'}
                </p>
              )}
              <div className={styles.actions}>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={answerMutation.isPending}
                >
                  답변 등록
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
