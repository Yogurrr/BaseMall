import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { Spinner } from '../components/Spinner/Spinner';
import { useCart } from '../hooks/useCart';
import { confirmTossPayment } from '../api/paymentApi';
import styles from './Checkout.module.css';

// 💡 토스 결제위젯에서 결제를 마치면 successUrl(이 페이지)로 paymentKey/orderId/amount와 함께 돌아온다.
export const TossPayApprove = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    if (!paymentKey || !orderId || !amount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 결제 승인 API 호출(외부 시스템) 결과를 반영하는 effect라 렌더링 중에 계산할 수 없다.
      setStatus('error');
      return;
    }

    confirmTossPayment(paymentKey, orderId, Number(amount))
      .then(() => {
        clearCart();
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [searchParams, clearCart]);

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <h1>토스페이먼츠 결제</h1>

        {status === 'pending' && (
          <div className={styles.empty}>
            <Spinner />
          </div>
        )}
        {status === 'success' && (
          <div className={styles.empty}>
            <p>🎉 주문이 완료되었습니다!</p>
            <Link to="/" className={styles.backLink}>
              ← 쇼핑 계속하기
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div className={styles.empty}>
            <p>결제 승인 중 오류가 발생했습니다.</p>
            <Link to="/checkout" className={styles.backLink}>
              ← 주문/결제로 돌아가기
            </Link>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};
