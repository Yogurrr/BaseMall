import { StatusMessage } from '../StatusMessage/StatusMessage';
import { formatPrice } from '../../api/productApi';
import type { Order } from '../../types/order';
import styles from './PointHistoryPanel.module.css';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

interface PointEntry {
  key: string;
  date: string;
  label: string;
  amount: number;
}

// 💡 별도의 적립금 거래 내역 API가 없어, 주문 목록(pointsUsed/pointsEarned)에서 내역을 구성한다.
// 주문취소 시 OrderService가 사용분을 환불하고 적립분을 회수하므로(OrderService.refundPoints),
// 취소된 주문은 그 반대 부호로 표시한다.
const buildEntries = (orders: Order[]): PointEntry[] => {
  const entries: PointEntry[] = [];

  for (const order of orders) {
    const cancelled = order.status === '주문취소';
    const used = order.pointsUsed ?? 0;
    const earned = order.pointsEarned ?? 0;

    if (used > 0) {
      entries.push({
        key: `${order.id}-use`,
        date: order.createdAt,
        label: cancelled ? `주문 #${order.id} 사용 취소(환불)` : `주문 #${order.id} 사용`,
        amount: cancelled ? used : -used,
      });
    }
    if (earned > 0) {
      entries.push({
        key: `${order.id}-earn`,
        date: order.createdAt,
        label: cancelled ? `주문 #${order.id} 적립 취소(회수)` : `주문 #${order.id} 적립`,
        amount: cancelled ? -earned : earned,
      });
    }
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

interface PointHistoryPanelProps {
  orders: Order[];
}

export const PointHistoryPanel = ({ orders }: PointHistoryPanelProps) => {
  const entries = buildEntries(orders);

  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <StatusMessage icon="🐾">적립금 내역이 없습니다.</StatusMessage>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {entries.map((entry) => (
        <li key={entry.key} className={styles.row}>
          <div className={styles.info}>
            <p className={styles.label}>{entry.label}</p>
            <p className={styles.date}>{formatDate(entry.date)}</p>
          </div>
          <span className={`${styles.amount} ${entry.amount >= 0 ? styles.plus : styles.minus}`}>
            {entry.amount >= 0 ? '+' : '-'}
            {formatPrice(Math.abs(entry.amount))}
          </span>
        </li>
      ))}
    </ul>
  );
};
