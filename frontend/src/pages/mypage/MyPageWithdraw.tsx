import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/Button/Button';
import { deleteAccount } from '../../api/authApi';
import { clearToken } from '../../api/authToken';
import styles from './MyPage.module.css';

const withdrawSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;

export const MyPageWithdraw = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { register, handleSubmit } = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (values: WithdrawFormValues) => {
    setIsWithdrawing(true);

    try {
      await deleteAccount(values.password);
      clearToken();
      queryClient.removeQueries({ queryKey: ['me'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
      queryClient.removeQueries({ queryKey: ['wishlist'] });
      navigate('/');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '탈퇴 처리 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>회원 탈퇴</p>

      <form
        className={styles.withdrawForm}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <p className={styles.withdrawWarning}>
          탈퇴하면 계정과 장바구니가 모두 삭제되며 되돌릴 수 없습니다.
          계속하려면 비밀번호를 입력하세요.
        </p>
        <label>
          <span className={styles.srOnly}>비밀번호</span>
          <input
            type="password"
            {...register('password')}
            placeholder="비밀번호"
          />
        </label>
        <div className={styles.withdrawActions}>
          <Button type="submit" variant="danger" isLoading={isWithdrawing}>
            탈퇴하기
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/mypage')}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
};
