import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SiteHeader } from '../../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter/SiteFooter';
import { MyPageSidebar } from '../../components/MyPageSidebar/MyPageSidebar';
import { Spinner } from '../../components/Spinner/Spinner';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { clearToken } from '../../api/authToken';
import { logout } from '../../api/authApi';
import styles from './MyPage.module.css';

export const MyPageLayout = () => {
  const { data: currentUser, isLoading, isError } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = () => {
    // 💡 서버쪽 리프레시 토큰도 폐기해야 새로고침 시 조용히 재로그인되는 걸 막을 수 있다.
    logout().finally(() => {
      clearToken();
      queryClient.removeQueries({ queryKey: ['me'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
      queryClient.removeQueries({ queryKey: ['wishlist'] });
      navigate('/');
    });
  };

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <Link to="/mypage" className={styles.pageTitle}>
          마이페이지
        </Link>

        {isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : isError || !currentUser ? (
          <div className={styles.empty}>
            <StatusMessage icon="⚠️">
              회원 정보를 불러오지 못했습니다.
            </StatusMessage>
          </div>
        ) : (
          <div className={styles.layout}>
            <MyPageSidebar onLogout={handleLogout} />

            <div className={styles.mainPanel}>
              <Outlet context={currentUser} />
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};
