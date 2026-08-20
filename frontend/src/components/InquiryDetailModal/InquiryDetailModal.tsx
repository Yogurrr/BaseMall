import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../Button/Button';
import { answerInquiry, deleteInquiry } from '../../api/inquiryApi';
import type { AdminInquiry, Inquiry } from '../../types/inquiry';
import styles from './InquiryDetailModal.module.css';

interface InquiryDetailModalProps {
  inquiry: Inquiry | AdminInquiry;
  mode: 'user' | 'admin';
  onClose: () => void;
}

export const InquiryDetailModal = ({ inquiry, mode, onClose }: InquiryDetailModalProps) => {
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState(inquiry);
  const [answerText, setAnswerText] = useState('');
  const author = mode === 'admin' ? (current as AdminInquiry) : null;

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
  });

  const handleAnswerSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = answerText.trim();
    if (!trimmed) return;
    answerMutation.mutate(trimmed);
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
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <dl className={styles.infoGrid}>
          <dt>카테고리</dt>
          <dd>{current.category}</dd>
          <dt>상태</dt>
          <dd>{current.status}</dd>
          <dt>작성일</dt>
          <dd>{new Date(current.createdAt).toLocaleString('ko-KR')}</dd>
          {current.orderId && (
            <>
              <dt>연결된 주문</dt>
              <dd>#{current.orderId}</dd>
            </>
          )}
          {author && (
            <>
              <dt>작성자</dt>
              <dd>{author.authorName} ({author.authorEmail})</dd>
            </>
          )}
        </dl>

        <p className={styles.content}>{current.content}</p>
        {current.imageUrl && (
          <img className={styles.attachedImage} src={current.imageUrl} alt="문의 첨부 이미지" />
        )}

        <div className={styles.answerSection}>
          <h3>답변</h3>
          {current.answer ? (
            <>
              <p className={styles.content}>{current.answer}</p>
              {current.answeredAt && (
                <p className={styles.answeredAt}>{new Date(current.answeredAt).toLocaleString('ko-KR')}</p>
              )}
            </>
          ) : mode === 'admin' ? (
            <form className={styles.answerForm} onSubmit={handleAnswerSubmit}>
              <textarea
                className={styles.textarea}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="답변을 입력해주세요."
                maxLength={2000}
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
          ) : (
            <p className={styles.pendingNotice}>아직 답변이 등록되지 않았습니다.</p>
          )}
        </div>

        {mode === 'user' && current.status === '답변대기' && (
          <div className={styles.actions}>
            {deleteMutation.isError && <p className={styles.error}>삭제에 실패했습니다.</p>}
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
