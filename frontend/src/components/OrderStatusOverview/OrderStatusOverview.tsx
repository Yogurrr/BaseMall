import { Fragment, useState } from 'react';
import type { Order } from '../../types/order';
import styles from './OrderStatusOverview.module.css';

interface OrderStatusOverviewProps {
  orders: Order[];
  onMore: () => void;
}

const STEPS = ['결제완료', '배송준비중', '배송중', '배송완료'] as const;
const RECENT_DAYS = 30;

export const OrderStatusOverview = ({
  orders,
  onMore,
}: OrderStatusOverviewProps) => {
  // 💡 Date.now()는 순수하지 않아 렌더링 중 직접 호출할 수 없다. 컴포넌트가 떠 있는 동안은
  // "최근 30일" 기준선이 조금 지나도 무방해 마운트 시점 값으로 고정한다(lazy initializer는 최초 1회만 실행).
  const [since] = useState(
    () => Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000,
  );
  const recentOrders = orders.filter(
    (order) => new Date(order.createdAt).getTime() >= since,
  );

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.title}>
          주문/배송 조회
          <span className={styles.titleSuffix}>(최근 {RECENT_DAYS}일)</span>
        </p>
        <button type="button" className={styles.more} onClick={onMore}>
          더보기 ›
        </button>
      </div>

      <div className={styles.steps}>
        {STEPS.map((status, index) => (
          <Fragment key={status}>
            <div className={styles.step}>
              <span className={styles.count}>
                {recentOrders.filter((o) => o.status === status).length}
              </span>
              <span className={styles.label}>{status}</span>
            </div>
            {index < STEPS.length - 1 && (
              <span className={styles.arrow}>›</span>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
};
