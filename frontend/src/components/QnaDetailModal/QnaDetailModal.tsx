import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../Button/Button';
import { answerQna } from '../../api/qnaApi';
import type { AdminQna } from '../../types/qna';
import styles from './QnaDetailModal.module.css';

interface QnaDetailModalProps {
  qna: AdminQna;
  onClose: () => void;
}

export const QnaDetailModal = ({ qna, onClose }: QnaDetailModalProps) => {
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState(qna);
  const [answerText, setAnswerText] = useState('');

  const answerMutation = useMutation({
    mutationFn: (answer: string) => answerQna(current.id, answer),
    onSuccess: (updated) => {
      setCurrent(updated);
      queryClient.invalidateQueries({ queryKey: ['qna', 'admin'] });
    },
  });

  const handleAnswerSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = answerText.trim();
    if (!trimmed) return;
    answerMutation.mutate(trimmed);
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
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <dl className={styles.infoGrid}>
          <dt>상태</dt>
          <dd>{current.status}</dd>
          <dt>작성일</dt>
          <dd>{new Date(current.createdAt).toLocaleString('ko-KR')}</dd>
          <dt>작성자</dt>
          <dd>{current.authorName} ({current.authorEmail})</dd>
        </dl>

        <p className={styles.content}>{current.question}</p>

        <div className={styles.answerSection}>
          <h3>답변</h3>
          {current.answer ? (
            <>
              <p className={styles.content}>{current.answer}</p>
              {current.answeredAt && (
                <p className={styles.answeredAt}>{new Date(current.answeredAt).toLocaleString('ko-KR')}</p>
              )}
            </>
          ) : (
            <form className={styles.answerForm} onSubmit={handleAnswerSubmit}>
              <textarea
                className={styles.textarea}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="답변을 입력해주세요."
                maxLength={1000}
                rows={4}
                required
              />
              {answerMutation.isError && <p className={styles.error}>답변 등록에 실패했습니다.</p>}
              <div className={styles.actions}>
                <Button type="submit" size="sm" isLoading={answerMutation.isPending}>
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
