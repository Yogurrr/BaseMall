import { Link, NavLink } from 'react-router-dom';
import { ADMIN_MENU } from '../../constants/adminMenu';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  onLogout: () => void;
}

export const AdminSidebar = ({ onLogout }: AdminSidebarProps) => (
  <aside className={styles.sidebar}>
    <div className={styles.brand}>
      ⚾ KBO 굿즈
      <span>ADMIN</span>
    </div>
    <nav className={styles.tabs}>
      {ADMIN_MENU.map((item) => (
        <NavLink
          key={item.key}
          to={`/admin/${item.key}`}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
    <button type="button" className={styles.tab} onClick={onLogout}>
      로그아웃
    </button>
    <Link to="/" className={styles.backLink}>
      ← 쇼핑몰로 돌아가기
    </Link>
  </aside>
);
