import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { Spinner } from '../components/Spinner/Spinner';
import { refreshAccessToken } from '../api/axiosInstance';
import { linkKakaoAccount } from '../api/authApi';
import { consumeKakaoOAuthState } from '../utils/kakaoAuth';
import styles from './Checkout.module.css';

// 💡 카카오 인가 서버로 풀 리다이렉트했다가 돌아오는 콜백 페이지라 RequireAuth로 감싸지 않는다.
// 리다이렉트를 거치며 메모리에 있던 JWT가 날아가므로, App.tsx가 앱 시작 시 하는 것과 동일하게
// refreshAccessToken()을 먼저 호출해 httpOnly 리프레시 쿠키로 로그인 상태를 복구한 뒤 연동을 마무리한다.
export const MyPageKakaoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !consumeKakaoOAuthState(state)) {
      toast.error('카카오 연동이 취소되었습니다.');
      navigate('/mypage/profile-edit', { replace: true });
      return;
    }

    refreshAccessToken()
      .then(() => linkKakaoAccount(code))
      .then(() => {
        toast.success('카카오 알림 연동이 완료되었습니다.');
      })
      .catch(() => {
        toast.error('카카오 연동 중 오류가 발생했습니다.');
      })
      .finally(() => {
        navigate('/mypage/profile-edit', { replace: true });
      });
  }, [searchParams, navigate]);

  return (
    <div className={styles.page}>
      <SiteHeader />
      <div className={styles.content}>
        <h1>카카오 연동</h1>
        <div className={styles.empty}>
          <Spinner />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};
