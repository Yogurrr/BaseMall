import styles from './MyPageBanner.module.css';

interface MyPageBannerProps {
  name: string;
  role: 'USER' | 'ADMIN';
  team?: string;
  onSelectWishlist: () => void;
  onSelectProfile: () => void;
}

export const MyPageBanner = ({ name, role, team, onSelectWishlist, onSelectProfile }: MyPageBannerProps) => (
  <section className={styles.banner}>
    <div className={styles.greeting}>
      <span className={styles.name}>{name}님, 반갑습니다</span>
      <span className={styles.badge}>{role === 'ADMIN' ? '관리자' : '일반회원'}</span>
      {team && <span className={styles.badge}>⚾ {team}</span>}
    </div>
    <div className={styles.links}>
      <button type="button" className={styles.link} onClick={onSelectWishlist}>
        나의 위시리스트
      </button>
      <span className={styles.divider} />
      <button type="button" className={styles.link} onClick={onSelectProfile}>
        나의 프로필
      </button>
    </div>
  </section>
);
