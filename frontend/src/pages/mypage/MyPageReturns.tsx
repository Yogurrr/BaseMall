import { useQuery } from '@tanstack/react-query';
import { OrderHistoryPanel } from '../../components/OrderHistoryPanel/OrderHistoryPanel';
import { fetchMyOrders } from '../../api/orderApi';
import styles from './MyPage.module.css';

// 💡 별도의 반품/교환 상태는 없고, 현재 스키마에서 취소에 해당하는 상태는 '주문취소'뿐이다.
// 주문/배송 조회와 동일한 화면을 재사용하되 취소된 주문만 걸러서 보여준다.
export const MyPageReturns = () => {
  const { data: myOrders = [] } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: fetchMyOrders,
  });
  const cancelledOrders = myOrders.filter(
    (order) => order.status === '주문취소',
  );

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>취소/반품/교환 내역</p>

      <OrderHistoryPanel orders={cancelledOrders} />
    </div>
  );
};
