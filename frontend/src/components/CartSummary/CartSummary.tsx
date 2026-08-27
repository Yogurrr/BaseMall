import { Link } from 'react-router-dom';
import { Button } from '../Button/Button';
import { formatPrice } from '../../api/productApi';
import styles from './CartSummary.module.css';

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

interface CartSummaryProps {
  totalPrice: number;
}

export const CartSummary = ({ totalPrice }: CartSummaryProps) => {
  const shippingFee =
    totalPrice === 0 || totalPrice >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FEE;
  const estimatedTotal = totalPrice + shippingFee;

  return (
    <aside className={styles.summary}>
      <h2>주문 요약</h2>

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
          {formatPrice(FREE_SHIPPING_THRESHOLD - totalPrice)} 더 담으면
          무료배송!
        </p>
      )}

      <div className={styles.totalRow}>
        <span>예상 결제금액</span>
        <span>{formatPrice(estimatedTotal)}</span>
      </div>
      <p className={styles.hint}>
        쿠폰 할인은 주문/결제 페이지에서 적용할 수 있어요.
      </p>

      <Link to="/checkout" className={styles.checkoutLink}>
        <Button size="lg">주문하기</Button>
      </Link>
    </aside>
  );
};
