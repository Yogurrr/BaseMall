import { NavLink } from 'react-router-dom';
import styles from './MyPageSidebar.module.css';

export interface MyPageMenuItem {
  key: string;
  label: string;
}

export interface MyPageMenuGroup {
  title: string;
  items: MyPageMenuItem[];
}

export const MYPAGE_MENU: MyPageMenuGroup[] = [
  {
    title: '나의 쇼핑 정보',
    items: [
      { key: 'orders', label: '주문/배송 조회' },
      { key: 'returns', label: '취소/반품/교환 내역' },
      { key: 'cart', label: '장바구니' },
      { key: 'points', label: '적립금 내역' },
      { key: 'coupons', label: '쿠폰 내역' },
      { key: 'addresses', label: '배송 주소록 관리' },
    ],
  },
  {
    title: '활동 정보',
    items: [
      { key: 'recent', label: '최근 본 상품' },
      { key: 'wishlist', label: '나의 위시리스트' },
    ],
  },
  {
    title: '나의 정보',
    items: [
      { key: 'profile-edit', label: '회원 정보 수정' },
      { key: 'refund-account', label: '배송지/환불계좌 관리' },
      { key: 'withdraw', label: '회원 탈퇴' },
      { key: 'logout', label: '로그아웃' },
    ],
  },
  {
    title: '문의',
    items: [
      { key: 'inquiries', label: '1:1 문의 내역' },
      { key: 'qna', label: '상품 Q&A 내역' },
    ],
  },
];

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
                <button type="button" className={styles.item} onClick={onLogout}>
                  {item.label}
                </button>
              ) : (
                <NavLink
                  to={pathFor(item.key)}
                  className={({ isActive }) => `${styles.item} ${isActive ? styles.itemActive : ''}`}
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
