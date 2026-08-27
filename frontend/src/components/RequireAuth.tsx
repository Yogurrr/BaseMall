import { useEffect, useState, type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../api/authToken';
import { refreshAccessToken } from '../api/axiosInstance';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface RequireAuthProps {
  children: ReactElement;
  adminOnly?: boolean;
}

export const RequireAuth = ({
  children,
  adminOnly = false,
}: RequireAuthProps) => {
  // 💡 새로고침 직후엔 액세스 토큰이 메모리에서 비어있는 게 정상이라(httpOnly 리프레시 쿠키만 남아있음),
  // 시도가 끝나기 전에 바로 isLoggedIn()을 판단하면 실제로는 로그인 상태를 복구할 수 있는 사용자도
  // /login으로 잘못 튕겨나간다. 부트스트랩(다른 곳에서 이미 진행 중이면 프라미스를 공유)이 끝날
  // 때까지 판단을 미룬다.
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    refreshAccessToken().finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return null;
  }

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    return <RequireAdminRole>{children}</RequireAdminRole>;
  }

  return children;
};

const RequireAdminRole = ({ children }: { children: ReactElement }) => {
  const { data: currentUser, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return null;
  }

  if (isError || currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};
