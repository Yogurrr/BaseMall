import { useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '../Button/Button';
import {
  answerInquiry,
  deleteInquiry,
  fetchAllInquiries,
} from '../../api/inquiryApi';
import type { AdminInquiry, Inquiry } from '../../types/inquiry';
import { formatDateTime } from '../../utils/formatDate';
import styles from './InquiryDetailModal.module.css';

const answerSchema = z.object({
  answer: z.string().trim().min(1, '답변을 입력해주세요.').max(2000),
});

type AnswerFormValues = z.infer<typeof answerSchema>;

interface InquiryDetailModalProps {
  inquiry: Inquiry | AdminInquiry;
  mode: 'user' | 'admin';
  onClose: () => void;
}

export const InquiryDetailModal = ({
  inquiry,
  mode,
  onClose,
}: InquiryDetailModalProps) => {
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState(inquiry);
  const author = mode === 'admin' ? (current as AdminInquiry) : null;

  const { register, handleSubmit } = useForm<AnswerFormValues>({
    resolver: zodResolver(answerSchema),
    defaultValues: { answer: '' },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInquiry(current.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'me'] });
      onClose();
    },
  });

  const answerMutation = useMutation({
    mutationFn: (answer: string) => answerInquiry(current.id, answer),
    onSuccess: (updated) => {
      setCurrent(updated);
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'admin'] });
    },
    onError: async (error) => {
      // 💡 다른 관리자가 먼저 답변을 등록해 409(이미 답변완료)가 오는 동시성 케이스.
      // 목록을 다시 받아와 current를 최신화하면 폼이 답변 표시로 자동 전환된다.
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const all = await fetchAllInquiries();
        const fresh = all.find((item) => item.id === current.id);
        if (fresh) setCurrent(fresh);
        queryClient.invalidateQueries({ queryKey: ['inquiries', 'admin'] });
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

  const handleDelete = () => {
    if (window.confirm('문의를 삭제하시겠습니까?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="inquiry-detail-title">{current.title}</h2>
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
          <dt>카테고리</dt>
          <dd>{current.category}</dd>
          <dt>상태</dt>
          <dd>{current.status}</dd>
          <dt>작성일</dt>
          <dd>{formatDateTime(current.createdAt)}</dd>
          {current.orderId && (
            <>
              <dt>연결된 주문</dt>
              <dd>#{current.orderId}</dd>
            </>
          )}
          {author && (
            <>
              <dt>작성자</dt>
              <dd>
                {author.authorName} ({author.authorEmail})
              </dd>
            </>
          )}
        </dl>

        <p className={styles.content}>{current.content}</p>
        {current.imageUrl && (
          <img
            className={styles.attachedImage}
            src={current.imageUrl}
            alt="문의 첨부 이미지"
          />
        )}

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
          ) : mode === 'admin' ? (
            <form
              className={styles.answerForm}
              onSubmit={handleSubmit(onAnswerSubmit, onAnswerInvalid)}
              noValidate
            >
              <textarea
                className={styles.textarea}
                {...register('answer')}
                placeholder="답변을 입력해주세요."
                maxLength={2000}
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
          ) : (
            <p className={styles.pendingNotice}>
              아직 답변이 등록되지 않았습니다.
            </p>
          )}
        </div>

        {mode === 'user' && current.status === '답변대기' && (
          <div className={styles.actions}>
            {deleteMutation.isError && (
              <p className={styles.error}>삭제에 실패했습니다.</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              문의 삭제
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
