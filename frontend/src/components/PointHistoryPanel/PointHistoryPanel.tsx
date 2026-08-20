import { useMemo, useState } from 'react';
import { formatPrice } from '../../api/productApi';
import type { PointTransaction } from '../../types/point';
import { MonthRangeFilter } from '../MonthRangeFilter/MonthRangeFilter';
import { defaultMonthRange, type DateRange } from '../../utils/dateRange';
import styles from './PointHistoryPanel.module.css';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

interface PointHistoryPanelProps {
  transactions: PointTransaction[];
}

export const PointHistoryPanel = ({ transactions }: PointHistoryPanelProps) => {
  const [appliedRange, setAppliedRange] = useState<DateRange>(defaultMonthRange);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const date = new Date(transaction.createdAt);
      return date >= appliedRange.from && date <= appliedRange.to;
    });
  }, [transactions, appliedRange]);

  return (
    <div className={styles.panel}>
      <MonthRangeFilter
        label="조회기간"
        notice="최근 5년 이내 적립금 내역만 조회할 수 있습니다."
        onApply={setAppliedRange}
      />

      {filteredTransactions.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>!</span>
          <p>기간 내 적립금 내역이 없습니다</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {filteredTransactions.map((transaction) => (
            <li key={transaction.id} className={styles.row}>
              <div className={styles.info}>
                <p className={styles.label}>{transaction.description}</p>
                <p className={styles.date}>{formatDate(transaction.createdAt)}</p>
              </div>
              <span className={`${styles.amount} ${transaction.amount >= 0 ? styles.plus : styles.minus}`}>
                {transaction.amount >= 0 ? '+' : '-'}
                {formatPrice(Math.abs(transaction.amount))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
