import type { Coupon } from '../../types/coupon';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import styles from './CouponListPanel.module.css';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

interface CouponListPanelProps {
  coupons: Coupon[];
  emptyMessage: string;
}

export const CouponListPanel = ({ coupons, emptyMessage }: CouponListPanelProps) => {
  if (coupons.length === 0) {
    return (
      <div className={styles.empty}>
        <StatusMessage icon="🎟️">{emptyMessage}</StatusMessage>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {coupons.map((coupon) => (
        <li key={coupon.id} className={`${styles.card} ${coupon.usedAt ? styles.used : ''}`}>
          <span className={styles.percent}>{coupon.discountPercent}%</span>
          <div className={styles.info}>
            <p className={styles.name}>{coupon.name}</p>
            <p className={styles.meta}>
              {coupon.usedAt ? `사용일 ${formatDate(coupon.usedAt)}` : `발급일 ${formatDate(coupon.issuedAt)}`}
            </p>
          </div>
          {coupon.usedAt && <span className={styles.badge}>사용완료</span>}
        </li>
      ))}
    </ul>
  );
};
