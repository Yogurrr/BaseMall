import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Spinner } from '../components/Spinner/Spinner';
import { loginWithKakao } from '../api/authApi';
import { setToken } from '../api/authToken';
import { consumeKakaoOAuthState } from '../utils/kakaoAuth';
import styles from './Login.module.css';

// 💡 카카오 인가 서버에서 돌아오는 콜백. 아직 로그인 전이라 세션 복구가 필요한
// MyPageKakaoCallback과 달리, 여기서는 응답으로 받은 새 JWT를 그대로 저장하면 된다.
export const LoginKakaoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !consumeKakaoOAuthState(state)) {
      toast.error('카카오 로그인이 취소되었습니다.');
      navigate('/login', { replace: true });
      return;
    }

    loginWithKakao(code)
      .then((result) => {
        setToken(result.token);
        navigate('/');
      })
      .catch(() => {
        toast.error('카카오 로그인 중 오류가 발생했습니다.');
        navigate('/login', { replace: true });
      });
  }, [searchParams, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>카카오 로그인</h1>
        <Spinner />
      </div>
    </div>
  );
};
