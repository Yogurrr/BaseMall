import { Link, useSearchParams } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import styles from './Checkout.module.css';

const CANCEL_CODES = new Set(['USER_CANCEL', 'PAY_PROCESS_CANCELED']);

// 💡 토스 결제위젯에서 취소하거나 결제가 실패하면 failUrl(이 페이지)로 code와 함께 돌아온다.
// 주문은 생성되지 않는다.
export const TossPayNotice = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const message = code && CANCEL_CODES.has(code) ? '결제가 취소되었습니다.' : '결제에 실패했습니다.';

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <h1>토스페이먼츠 결제</h1>
        <div className={styles.empty}>
          <p>{message}</p>
          <Link to="/checkout" className={styles.backLink}>
            ← 주문/결제로 돌아가기
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};
