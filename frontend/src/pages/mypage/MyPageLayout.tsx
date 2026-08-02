import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SiteHeader } from '../../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../../components/SiteFooter/SiteFooter';
import { MyPageSidebar } from '../../components/MyPageSidebar/MyPageSidebar';
import { Spinner } from '../../components/Spinner/Spinner';
import { StatusMessage } from '../../components/StatusMessage/StatusMessage';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { clearToken } from '../../api/authToken';
import styles from './MyPage.module.css';

export const MyPageLayout = () => {
  const { data: currentUser, isLoading, isError } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    queryClient.removeQueries({ queryKey: ['me'] });
    queryClient.removeQueries({ queryKey: ['cart'] });
    navigate('/');
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
            <StatusMessage icon="⚠️">회원 정보를 불러오지 못했습니다.</StatusMessage>
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
