import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PointHistoryPanel } from '../../components/PointHistoryPanel/PointHistoryPanel';
import { fetchMyPointTransactions } from '../../api/pointApi';
import { formatPrice } from '../../api/productApi';
import type { UserInfo } from '../../types/user';
import styles from './MyPage.module.css';

export const MyPagePoints = () => {
  const currentUser = useOutletContext<UserInfo>();
  const { data: transactions = [] } = useQuery({ queryKey: ['points', 'me'], queryFn: fetchMyPointTransactions });

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>보유 적립금 {formatPrice(currentUser.points)}</p>

      <PointHistoryPanel transactions={transactions} />
    </div>
  );
};
