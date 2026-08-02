import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '../../components/Button/Button';
import { deleteAccount } from '../../api/authApi';
import { clearToken } from '../../api/authToken';
import styles from './MyPage.module.css';

export const MyPageWithdraw = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async (event: FormEvent) => {
    event.preventDefault();
    setWithdrawError(null);
    setIsWithdrawing(true);

    try {
      await deleteAccount(password);
      clearToken();
      queryClient.removeQueries({ queryKey: ['me'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
      navigate('/');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '탈퇴 처리 중 오류가 발생했습니다.';
      setWithdrawError(message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>회원 탈퇴</p>

      <form className={styles.withdrawForm} onSubmit={handleWithdraw}>
        <p className={styles.withdrawWarning}>
          탈퇴하면 계정과 장바구니가 모두 삭제되며 되돌릴 수 없습니다. 계속하려면 비밀번호를 입력하세요.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
        />
        {withdrawError && <p className={styles.withdrawError}>{withdrawError}</p>}
        <div className={styles.withdrawActions}>
          <Button type="submit" variant="danger" isLoading={isWithdrawing}>
            탈퇴하기
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/mypage')}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
};
