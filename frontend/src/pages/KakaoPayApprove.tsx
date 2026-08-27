import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { Spinner } from '../components/Spinner/Spinner';
import { useCart } from '../hooks/useCart';
import { approveKakaoPayment } from '../api/paymentApi';
import styles from './Checkout.module.css';

// 💡 카카오 결제창에서 결제를 마치면 approval_url(이 페이지)로 돌아온다.
// orderId는 우리가 ready 단계에서 approval_url에 직접 심어둔 값, pg_token은 카카오가 붙여준다.
export const KakaoPayApprove = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(
    'pending',
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const orderId = searchParams.get('orderId');
    const pgToken = searchParams.get('pg_token');
    if (!orderId || !pgToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 결제 승인 API 호출(외부 시스템) 결과를 반영하는 effect라 렌더링 중에 계산할 수 없다.
      setStatus('error');
      return;
    }

    approveKakaoPayment(orderId, pgToken)
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
        <h1>카카오페이 결제</h1>

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
