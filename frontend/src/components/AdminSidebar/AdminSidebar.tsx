import { Link, NavLink } from 'react-router-dom';
import styles from './AdminSidebar.module.css';

export interface AdminMenuItem {
  key: string;
  label: string;
}

export const ADMIN_MENU: AdminMenuItem[] = [
  { key: 'products', label: '상품 관리' },
  { key: 'orders', label: '주문 관리' },
  { key: 'users', label: '회원 관리' },
  { key: 'categories', label: '카테고리 관리' },
  { key: 'coupons', label: '쿠폰 관리' },
  { key: 'banners', label: '배너 관리' },
  { key: 'stats', label: '통계' },
  { key: 'sales', label: '매출' },
];

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
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
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
