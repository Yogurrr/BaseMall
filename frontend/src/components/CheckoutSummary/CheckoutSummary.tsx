import { Button } from '../Button/Button';
import { formatPrice } from '../../api/productApi';
import styles from './CheckoutSummary.module.css';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

interface CheckoutSummaryProps {
  totalPrice: number;
  discountAmount: number;
  pointsUsed: number;
  canSubmit: boolean;
  agreeToTerms: boolean;
  onAgreeToTermsChange: (value: boolean) => void;
  onCheckout: () => void;
  isSubmitting?: boolean;
}

export const CheckoutSummary = ({
  totalPrice,
  discountAmount,
  pointsUsed,
  canSubmit,
  agreeToTerms,
  onAgreeToTermsChange,
  onCheckout,
  isSubmitting,
}: CheckoutSummaryProps) => {
  const shippingFee =
    totalPrice === 0 || totalPrice >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FEE;
  const grandTotal = totalPrice - discountAmount - pointsUsed + shippingFee;

  return (
    <aside className={styles.summary}>
      <h2>최종 결제정보</h2>

      <div className={styles.row}>
        <span>총 상품금액</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>
      {discountAmount > 0 && (
        <div className={styles.row}>
          <span>쿠폰 할인금액</span>
          <span>-{formatPrice(discountAmount)}</span>
        </div>
      )}
      {pointsUsed > 0 && (
        <div className={styles.row}>
          <span>적립금 사용</span>
          <span>-{formatPrice(pointsUsed)}</span>
        </div>
      )}
      <div className={styles.row}>
        <span>총 배송비</span>
        <span>{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</span>
      </div>
      {shippingFee > 0 && (
        <p className={styles.hint}>
          {formatPrice(FREE_SHIPPING_THRESHOLD - totalPrice)} 더 담으면
          무료배송!
        </p>
      )}

      <div className={styles.totalRow}>
        <span>최종 결제금액</span>
        <span>{formatPrice(grandTotal)}</span>
      </div>

      <Button
        size="lg"
        onClick={onCheckout}
        disabled={totalPrice === 0 || !canSubmit || !agreeToTerms}
        isLoading={isSubmitting}
      >
        결제하기
      </Button>

      <label className={styles.agreeRow}>
        <input
          type="checkbox"
          checked={agreeToTerms}
          onChange={(e) => onAgreeToTermsChange(e.target.checked)}
        />
        주문 상품정보를 확인하였으며 결제에 동의합니다.
      </label>
    </aside>
  );
};
