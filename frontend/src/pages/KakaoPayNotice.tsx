import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import styles from './Checkout.module.css';

interface KakaoPayNoticeProps {
  status: 'cancel' | 'fail';
}

// 💡 카카오 결제창에서 취소하거나 결제가 실패하면 cancel_url/fail_url로 돌아온다. 주문은 생성되지 않는다.
export const KakaoPayNotice = ({ status }: KakaoPayNoticeProps) => {
  const message =
    status === 'cancel' ? '결제가 취소되었습니다.' : '결제에 실패했습니다.';

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <h1>카카오페이 결제</h1>
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
