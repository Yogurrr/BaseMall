import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../api/authToken';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface RequireAuthProps {
  children: ReactElement;
  adminOnly?: boolean;
}

export const RequireAuth = ({ children, adminOnly = false }: RequireAuthProps) => {
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
