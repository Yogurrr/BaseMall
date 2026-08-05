import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { CartItemRow } from '../components/CartItemRow/CartItemRow';
import { CheckoutSummary } from '../components/CheckoutSummary/CheckoutSummary';
import { Spinner } from '../components/Spinner/Spinner';
import { useCart } from '../context/CartContext';
import { isLoggedIn } from '../api/authToken';
import { createOrder } from '../api/orderApi';
import { fetchMyCoupons } from '../api/couponApi';
import styles from './Checkout.module.css';

export const Checkout = () => {
  const { items, totalPrice, isLoading, clearCart } = useCart();
  const [orderedMessage, setOrderedMessage] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);

  const { data: myCoupons = [] } = useQuery({
    queryKey: ['coupons', 'me'],
    queryFn: fetchMyCoupons,
    enabled: isLoggedIn(),
  });
  const usableCoupons = myCoupons.filter((coupon) => !coupon.usedAt);

  const handleCheckout = async () => {
    setCheckoutError(null);

    // 💡 비회원은 계정 장바구니/주문 개념이 없으므로 화면상으로만 완료 처리한다.
    if (!isLoggedIn()) {
      clearCart();
      setOrderedMessage(true);
      return;
    }

    if (!address.trim()) return;

    setIsCheckingOut(true);
    try {
      await createOrder(address.trim(), selectedCouponId ?? undefined);
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

  if (!orderedMessage && !isLoading && items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <h1>주문/결제</h1>

        {orderedMessage ? (
          <div className={styles.empty}>
            <p>🎉 주문이 완료되었습니다!</p>
            <Link to="/" className={styles.backLink}>
              ← 쇼핑 계속하기
            </Link>
          </div>
        ) : isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : (
          <div className={styles.layout}>
            <div className={styles.items}>
              {items.map((item) => (
                <CartItemRow key={item.cartItemId} item={item} readOnly />
              ))}
              <Link to="/cart" className={styles.backLink}>
                ← 장바구니로 돌아가기
              </Link>
            </div>

            <div>
              {checkoutError && <p className={styles.checkoutError}>{checkoutError}</p>}
              <CheckoutSummary
                totalPrice={totalPrice}
                address={address}
                onAddressChange={setAddress}
                onCheckout={handleCheckout}
                isSubmitting={isCheckingOut}
                coupons={usableCoupons}
                selectedCouponId={selectedCouponId}
                onCouponChange={setSelectedCouponId}
              />
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};
