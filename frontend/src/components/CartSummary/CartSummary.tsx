import { Button } from '../Button/Button';
import { formatPrice } from '../../api/productApi';
import styles from './CartSummary.module.css';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

interface CartSummaryProps {
  totalPrice: number;
  address: string;
  onAddressChange: (value: string) => void;
  onCheckout: () => void;
  isSubmitting?: boolean;
}

export const CartSummary = ({ totalPrice, address, onAddressChange, onCheckout, isSubmitting }: CartSummaryProps) => {
  const shippingFee = totalPrice === 0 || totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const grandTotal = totalPrice + shippingFee;

  return (
    <aside className={styles.summary}>
      <h2>주문 요약</h2>

      <label className={styles.addressField}>
        배송지
        <input
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="배송받으실 주소를 입력하세요"
        />
      </label>

      <div className={styles.row}>
        <span>상품 금액</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>
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
