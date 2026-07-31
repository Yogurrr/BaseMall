import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { CartItemRow } from '../components/CartItemRow/CartItemRow';
import { CartSummary } from '../components/CartSummary/CartSummary';
import { Spinner } from '../components/Spinner/Spinner';
import { useCart } from '../context/CartContext';
import { isLoggedIn } from '../api/authToken';
import { createOrder } from '../api/orderApi';
import styles from './Cart.module.css';

export const Cart = () => {
  const { items, totalPrice, isLoading, updateQuantity, removeItem, clearCart } = useCart();
  const [orderedMessage, setOrderedMessage] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setCheckoutError(null);

    // 💡 비회원은 계정 장바구니/주문 개념이 없으므로 기존처럼 화면상으로만 완료 처리한다.
    if (!isLoggedIn()) {
      clearCart();
      setOrderedMessage(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      await createOrder();
      clearCart();
      setOrderedMessage(true);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '주문 처리 중 오류가 발생했습니다.';
      setCheckoutError(message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <h1>장바구니</h1>

        {orderedMessage ? (
          <div className={styles.empty}>
            <p>🎉 주문이 완료되었습니다!</p>
            <Link to="/" className={styles.backLink}>
              ← 쇼핑 계속하기
            </Link>
          </div>
        ) : isLoading ? (
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
                  key={item.id}
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
              {checkoutError && <p className={styles.checkoutError}>{checkoutError}</p>}
              <CartSummary totalPrice={totalPrice} onCheckout={handleCheckout} isSubmitting={isCheckingOut} />
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};
