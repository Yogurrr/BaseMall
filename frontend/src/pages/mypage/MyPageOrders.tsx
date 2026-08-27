import { useQuery } from '@tanstack/react-query';
import { OrderHistoryPanel } from '../../components/OrderHistoryPanel/OrderHistoryPanel';
import { fetchMyOrders } from '../../api/orderApi';
import styles from './MyPage.module.css';

export const MyPageOrders = () => {
  const { data: myOrders = [] } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: fetchMyOrders,
  });

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>주문/배송 조회</p>

      <OrderHistoryPanel orders={myOrders} />
    </div>
  );
};
