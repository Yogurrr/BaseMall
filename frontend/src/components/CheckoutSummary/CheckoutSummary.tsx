import { Button } from '../Button/Button';
import { formatPrice } from '../../api/productApi';
import type { Coupon } from '../../types/coupon';
import styles from './CheckoutSummary.module.css';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

interface CheckoutSummaryProps {
  totalPrice: number;
  address: string;
  onAddressChange: (value: string) => void;
  onCheckout: () => void;
  isSubmitting?: boolean;
  coupons?: Coupon[];
  selectedCouponId?: number | null;
  onCouponChange?: (couponId: number | null) => void;
}

export const CheckoutSummary = ({
  totalPrice,
  address,
  onAddressChange,
  onCheckout,
  isSubmitting,
  coupons = [],
  selectedCouponId,
  onCouponChange,
}: CheckoutSummaryProps) => {
  const shippingFee = totalPrice === 0 || totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const selectedCoupon = coupons.find((coupon) => coupon.id === selectedCouponId);
  const discountAmount = selectedCoupon ? Math.floor((totalPrice * selectedCoupon.discountPercent) / 100) : 0;
  const grandTotal = totalPrice - discountAmount + shippingFee;

  return (
    <aside className={styles.summary}>
      <h2>결제 정보</h2>

      <label className={styles.addressField}>
        배송지
        <input
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="배송받으실 주소를 입력하세요"
        />
      </label>

      {onCouponChange && coupons.length > 0 && (
        <label className={styles.addressField}>
          쿠폰
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
        </label>
      )}

      <div className={styles.row}>
        <span>상품 금액</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>
      {discountAmount > 0 && (
        <div className={styles.row}>
          <span>쿠폰 할인</span>
          <span>-{formatPrice(discountAmount)}</span>
        </div>
      )}
      <div className={styles.row}>
        <span>배송비</span>
        <span>{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</span>
      </div>
      {shippingFee > 0 && (
        <p className={styles.hint}>
          {formatPrice(FREE_SHIPPING_THRESHOLD - totalPrice)} 더 담으면 무료배송!
        </p>
      )}

      <div className={styles.totalRow}>
        <span>총 결제금액</span>
        <span>{formatPrice(grandTotal)}</span>
      </div>

      <Button size="lg" onClick={onCheckout} disabled={totalPrice === 0 || !address.trim()} isLoading={isSubmitting}>
        결제하기
      </Button>
    </aside>
  );
};
