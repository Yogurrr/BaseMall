import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { ProfileCard } from '../components/ProfileCard/ProfileCard';
import { QuickLinkCard } from '../components/QuickLinkCard/QuickLinkCard';
import { SelectFilter } from '../components/SelectFilter/SelectFilter';
import { Button } from '../components/Button/Button';
import { Spinner } from '../components/Spinner/Spinner';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useCart } from '../context/CartContext';
import { deleteAccount, updateFavoriteTeam } from '../api/authApi';
import { clearToken } from '../api/authToken';
import { fetchTeams } from '../api/productApi';
import styles from './MyPage.module.css';

const NO_TEAM = '선택 안 함';

export const MyPage = () => {
  const { data: currentUser, isLoading, isError } = useCurrentUser();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: teamNames = [] } = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
  const teamOptions = useMemo(() => [NO_TEAM, ...teamNames], [teamNames]);

  const favoriteTeamMutation = useMutation({
    mutationFn: (team: string) => updateFavoriteTeam(team === NO_TEAM ? null : team),
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated);
    },
  });

  const [showWithdraw, setShowWithdraw] = useState(false);
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
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <h1 className={styles.pageTitle}>마이페이지</h1>

        {isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : isError || !currentUser ? (
          <p className={styles.empty}>회원 정보를 불러오지 못했습니다.</p>
        ) : (
          <>
            <ProfileCard name={currentUser.name} email={currentUser.email} role={currentUser.role} />

            <section className={styles.teamSection}>
              <p className={styles.teamLabel}>⚾ 응원팀</p>
              <SelectFilter
                options={teamOptions}
                value={currentUser.favoriteTeam ?? NO_TEAM}
                onChange={(team) => favoriteTeamMutation.mutate(team)}
              />
              {favoriteTeamMutation.isPending && <Spinner size={16} />}
              {favoriteTeamMutation.isError && (
                <p className={styles.withdrawError}>응원팀 설정에 실패했습니다.</p>
              )}
            </section>

            <div className={styles.linkGrid}>
              <QuickLinkCard
                icon="🛒"
                label="장바구니"
                description={totalCount > 0 ? `${totalCount}개의 상품이 담겨 있어요` : '장바구니가 비어 있어요'}
                to="/cart"
              />
              {currentUser.role === 'ADMIN' && (
                <QuickLinkCard icon="🛠️" label="관리자 페이지" description="상품 · 회원 관리" to="/admin" />
              )}
            </div>

            <section className={styles.dangerZone}>
              {!showWithdraw ? (
                <button
                  type="button"
                  className={styles.withdrawTrigger}
                  onClick={() => setShowWithdraw(true)}
                >
                  회원 탈퇴
                </button>
              ) : (
                <form className={styles.withdrawForm} onSubmit={handleWithdraw}>
                  <p className={styles.withdrawWarning}>
                    탈퇴하면 계정과 장바구니가 모두 삭제되며 되돌릴 수 없습니다. 계속하려면 비밀번호를
                    입력하세요.
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
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowWithdraw(false);
                        setPassword('');
                        setWithdrawError(null);
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              )}
            </section>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};
