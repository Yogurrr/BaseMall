import { useQuery } from '@tanstack/react-query';
import { CouponListPanel } from '../../components/CouponListPanel/CouponListPanel';
import { fetchMyCoupons } from '../../api/couponApi';
import styles from './MyPage.module.css';

export const MyPageCoupons = () => {
  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons', 'me'],
    queryFn: fetchMyCoupons,
  });

  const unusedCoupons = coupons.filter((coupon) => !coupon.usedAt);
  const usedCoupons = coupons.filter((coupon) => coupon.usedAt);

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>
        사용 가능한 쿠폰 {unusedCoupons.length}장
      </p>
      <CouponListPanel
        coupons={unusedCoupons}
        emptyMessage="사용 가능한 쿠폰이 없습니다."
      />

      <p className={styles.comingSoonTitle}>사용한 쿠폰</p>
      <CouponListPanel
        coupons={usedCoupons}
        emptyMessage="사용한 쿠폰이 없습니다."
      />
    </div>
  );
};
