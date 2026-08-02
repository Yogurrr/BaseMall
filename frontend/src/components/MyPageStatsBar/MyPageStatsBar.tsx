import styles from './MyPageStatsBar.module.css';

interface MyPageStatsBarProps {
  wishlistCount: number;
}

export const MyPageStatsBar = ({ wishlistCount }: MyPageStatsBarProps) => (
  <section className={styles.bar}>
    <div className={styles.stat}>
      <span className={styles.label}>적립금</span>
      <span className={styles.value}>0P</span>
    </div>
    <div className={styles.stat}>
      <span className={styles.label}>쿠폰</span>
      <span className={styles.value}>0개</span>
    </div>
    <div className={styles.stat}>
      <span className={styles.label}>찜한 상품</span>
      <span className={styles.value}>{wishlistCount}개</span>
    </div>
  </section>
);
