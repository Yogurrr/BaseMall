import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { CartItemRow } from '../components/CartItemRow/CartItemRow';
import { CartSummary } from '../components/CartSummary/CartSummary';
import { Spinner } from '../components/Spinner/Spinner';
import { useCart } from '../hooks/useCart';
import styles from './Cart.module.css';

export const Cart = () => {
  const { items, totalPrice, isLoading, updateQuantity, removeItem } = useCart();

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <h1>장바구니</h1>

        {isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <p>장바구니가 비어 있습니다.</p>
            <Link to="/" className={styles.backLink}>
              ← 쇼핑 계속하기
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            <div className={styles.items}>
              {items.map((item) => (
                <CartItemRow
                  key={item.cartItemId}
                  item={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
              <Link to="/" className={styles.backLink}>
                ← 쇼핑 계속하기
              </Link>
            </div>

            <div>
              <CartSummary totalPrice={totalPrice} />
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};
