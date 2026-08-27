import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'sonner';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { isLoggedIn } from '../../api/authToken';
import { createQna, deleteQna, fetchQnas } from '../../api/qnaApi';
import { Button } from '../Button/Button';
import { Spinner } from '../Spinner/Spinner';
import styles from './ProductQna.module.css';

const questionSchema = z.object({
  question: z.string().trim().min(1, '질문을 입력해주세요.').max(1000),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface ProductQnaProps {
  productId: number;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export const ProductQna = ({ productId }: ProductQnaProps) => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const { register, handleSubmit, reset } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: { question: '' },
  });

  const {
    data: qnas = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['qna', productId],
    queryFn: () => fetchQnas(productId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['qna', productId] });
  };

  const createMutation = useMutation({
    mutationFn: (value: string) => createQna(productId, value),
    onSuccess: () => {
      reset({ question: '' });
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (qnaId: number) => deleteQna(productId, qnaId),
    onSuccess: invalidate,
  });

  const onSubmit = (values: QuestionFormValues) => {
    createMutation.mutate(values.question);
  };

  const onInvalid = (formErrors: FieldErrors<QuestionFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;
    toast.error(
      typeof firstMessage === 'string'
        ? firstMessage
        : '입력값을 확인해주세요.',
    );
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        상품 Q&A {qnas.length > 0 && `(${qnas.length})`}
      </h2>

      {isLoading ? (
        <div className={styles.empty}>
          <Spinner />
        </div>
      ) : isError ? (
        <p className={styles.error}>Q&A를 불러오지 못했습니다.</p>
      ) : (
        <>
          {!isLoggedIn() && (
            <p className={styles.notice}>로그인 후 질문을 남길 수 있습니다.</p>
          )}

          {isLoggedIn() && (
            <form
              className={styles.form}
              onSubmit={handleSubmit(onSubmit, onInvalid)}
              noValidate
            >
              <textarea
                className={styles.textarea}
                {...register('question')}
                placeholder="상품에 대해 궁금한 점을 질문해보세요."
                maxLength={1000}
                rows={3}
              />
              <div className={styles.formActions}>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={createMutation.isPending}
                >
                  질문 등록
                </Button>
              </div>
            </form>
          )}

          {createMutation.isError && (
            <p className={styles.error}>
              {axios.isAxiosError(createMutation.error) &&
              createMutation.error.response?.data?.message
                ? createMutation.error.response.data.message
                : '질문 등록에 실패했습니다.'}
            </p>
          )}

          {qnas.length === 0 ? (
            <p className={styles.empty}>
              아직 등록된 질문이 없습니다. 첫 질문을 남겨보세요!
            </p>
          ) : (
            <ul className={styles.list}>
              {qnas.map((qna) => {
                const isOwner = qna.userId === currentUser?.id;
                const isAdmin = currentUser?.role === 'ADMIN';
                const canDelete =
                  isAdmin || (isOwner && qna.status === '답변대기');

                return (
                  <li key={qna.id} className={styles.item}>
                    <div className={styles.header}>
                      <div className={styles.headerLeft}>
                        <span className={styles.userName}>{qna.userName}</span>
                        <span
                          className={
                            qna.status === '답변완료'
                              ? styles.statusDone
                              : styles.statusPending
                          }
                        >
                          {qna.status}
                        </span>
                      </div>
                      <span className={styles.date}>
                        {formatDate(qna.createdAt)}
                      </span>
                    </div>
                    <p className={styles.question}>Q. {qna.question}</p>
                    {qna.answer && (
                      <p className={styles.answer}>A. {qna.answer}</p>
                    )}
                    {canDelete && (
                      <div className={styles.actions}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('질문을 삭제하시겠습니까?')) {
                              deleteMutation.mutate(qna.id);
                            }
                          }}
                        >
                          삭제
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
};
