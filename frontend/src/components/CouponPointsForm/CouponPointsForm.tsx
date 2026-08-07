import { Button } from '../Button/Button';
import { formatPrice } from '../../api/productApi';
import type { Coupon } from '../../types/coupon';
import styles from './CouponPointsForm.module.css';

interface CouponPointsFormProps {
  coupons: Coupon[];
  selectedCouponId: number | null;
  onCouponChange: (couponId: number | null) => void;
  discountAmount: number;
  availablePoints: number;
  pointsUsed: number;
  maxUsablePoints: number;
  onPointsUsedChange: (value: number) => void;
}

export const CouponPointsForm = ({
  coupons,
  selectedCouponId,
  onCouponChange,
  discountAmount,
  availablePoints,
  pointsUsed,
  maxUsablePoints,
  onPointsUsedChange,
}: CouponPointsFormProps) => {
  const handlePointsChange = (rawValue: string) => {
    const parsed = Math.floor(Number(rawValue) || 0);
    onPointsUsedChange(Math.min(Math.max(parsed, 0), maxUsablePoints));
  };

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>쿠폰할인정보</h2>
        <div className={styles.table}>
          <div className={styles.row}>
            <div className={styles.label}>쿠폰</div>
            <div className={styles.value}>
              {coupons.length > 0 ? (
                <select
                  value={selectedCouponId ?? ''}
                  onChange={(e) => onCouponChange(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">쿠폰 사용 안 함</option>
                  {coupons.map((coupon) => (
                    <option key={coupon.id} value={coupon.id}>
                      {coupon.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={styles.muted}>적용할 수 있는 쿠폰이 없습니다.</span>
              )}
              <span className={styles.discountAmount}>
                {discountAmount > 0 ? `-${formatPrice(discountAmount)}` : '0원'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>포인트 사용</h2>
        <div className={styles.table}>
          <div className={styles.row}>
            <div className={styles.label}>적립금</div>
            <div className={styles.value}>
              {availablePoints > 0 ? (
                <>
                  <input
                    type="number"
                    min={0}
                    max={maxUsablePoints}
                    value={pointsUsed}
                    onChange={(e) => handlePointsChange(e.target.value)}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => onPointsUsedChange(maxUsablePoints)}>
                    전액사용
                  </Button>
                  <span className={styles.balance}>보유 {formatPrice(availablePoints)}</span>
                </>
              ) : (
                <span className={styles.muted}>보유한 적립금이 없습니다.</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
