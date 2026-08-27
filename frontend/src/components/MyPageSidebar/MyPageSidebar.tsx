import { NavLink } from 'react-router-dom';
import { MYPAGE_MENU } from '../../constants/myPageMenu';
import styles from './MyPageSidebar.module.css';

const pathFor = (key: string) => (key === 'cart' ? '/cart' : `/mypage/${key}`);

interface MyPageSidebarProps {
  onLogout: () => void;
}

export const MyPageSidebar = ({ onLogout }: MyPageSidebarProps) => (
  <nav className={styles.sidebar} aria-label="마이페이지 메뉴">
    {MYPAGE_MENU.map((group) => (
      <div key={group.title} className={styles.group}>
        <p className={styles.groupTitle}>{group.title}</p>
        <ul className={styles.itemList}>
          {group.items.map((item) => (
            <li key={item.key}>
              {item.key === 'logout' ? (
                <button
                  type="button"
                  className={styles.item}
                  onClick={onLogout}
                >
                  {item.label}
                </button>
              ) : (
                <NavLink
                  to={pathFor(item.key)}
                  className={({ isActive }) =>
                    `${styles.item} ${isActive ? styles.itemActive : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </nav>
);
