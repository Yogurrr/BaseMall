import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/AdminSidebar/AdminSidebar';
import { clearToken } from '../../api/authToken';
import styles from './Admin.module.css';

export const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <AdminSidebar onLogout={handleLogout} />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};
