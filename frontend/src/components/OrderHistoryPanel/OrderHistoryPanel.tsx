import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order } from '../../types/order';
import { formatPrice } from '../../api/productApi';
import { cancelOrder } from '../../api/orderApi';
import { OrderDetailModal } from '../OrderDetailModal/OrderDetailModal';
import { ProductThumb } from '../ProductThumb/ProductThumb';
import { Button } from '../Button/Button';
import styles from './OrderHistoryPanel.module.css';

interface OrderHistoryPanelProps {
  orders: Order[];
}

type Preset = '1' | '3' | '6' | '12';

interface DateParts {
  y: number;
  m: number;
  d: number;
}

const PRESETS: { key: Preset; label: string; months: number }[] = [
  { key: '1', label: '1개월', months: 1 },
  { key: '3', label: '3개월', months: 3 },
  { key: '6', label: '6개월', months: 6 },
  { key: '12', label: '12개월', months: 12 },
];

const toParts = (date: Date): DateParts => ({
  y: date.getFullYear(),
  m: date.getMonth() + 1,
  d: date.getDate(),
});

const partsToDate = (p: DateParts) => new Date(p.y, p.m - 1, p.d);

const formatOrderDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const today = new Date();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 4 + i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

export const OrderHistoryPanel = ({ orders }: OrderHistoryPanelProps) => {
  const [activePreset, setActivePreset] = useState<Preset | null>('1');
  const [fromDate, setFromDate] = useState<DateParts>(() => toParts(monthsAgo(new Date(), 1)));
  const [toDate, setToDate] = useState<DateParts>(() => toParts(new Date()));
  const [appliedRange, setAppliedRange] = useState(() => ({
    from: monthsAgo(new Date(), 1),
    to: new Date(),
  }));
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const queryClient = useQueryClient();
  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleCancel = (order: Order) => {
    if (window.confirm('주문을 취소하시겠습니까?')) {
      cancelMutation.mutate(order.id);
    }
  };

  const handlePreset = (preset: Preset, months: number) => {
    setActivePreset(preset);
    const now = new Date();
    const from = monthsAgo(now, months);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    setFromDate(toParts(from));
    setToDate(toParts(now));
    setAppliedRange({ from, to });
  };

  const handleSearch = () => {
    const from = partsToDate(fromDate);
    const to = partsToDate(toDate);
    to.setHours(23, 59, 59, 999);
    setAppliedRange({ from, to });
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= appliedRange.from && createdAt <= appliedRange.to;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, appliedRange]);

  return (
    <div className={styles.panel}>
      <div className={styles.filterBox}>
        <div className={styles.filterFields}>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>구매기간</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={`${styles.presetButton} ${activePreset === preset.key ? styles.presetButtonActive : ''}`}
                onClick={() => handlePreset(preset.key, preset.months)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className={styles.filterRow}>
            <span className={styles.filterLabel} />
            <div className={styles.dateRange}>
              <DateSelect
                parts={fromDate}
                onChange={(next) => {
                  setActivePreset(null);
                  setFromDate(next);
                }}
              />
              <span>~</span>
              <DateSelect
                parts={toDate}
                onChange={(next) => {
                  setActivePreset(null);
                  setToDate(next);
                }}
              />
            </div>
          </div>
        </div>

        <button type="button" className={styles.searchButton} onClick={handleSearch}>
          조회
        </button>
      </div>

      <ul className={styles.notices}>
        <li>최근 5년 이내 주문 내역만 조회할 수 있습니다.</li>
      </ul>

      {filteredOrders.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>!</span>
          <p>기간 내 주문내역이 없습니다</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>주문일자</th>
              <th>상품</th>
              <th>수량</th>
              <th>주문금액</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const [firstItem, ...rest] = order.items;
              return (
                <tr key={order.id} onClick={() => setSelectedOrder(order)}>
                  <td>{formatOrderDate(order.createdAt)}</td>
                  <td>
                    {firstItem ? (
                      <>
                        <ProductThumb imageUrl={firstItem.imageUrl} alt={firstItem.name} size="sm" /> {firstItem.name}
                      </>
                    ) : (
                      '-'
                    )}
                    {rest.length > 0 && <span className={styles.itemCategory}>외 {rest.length}건</span>}
                  </td>
                  <td>{totalQuantity}</td>
                  <td>{formatPrice(order.totalPrice)}</td>
                  <td>
                    {order.status}
                    {order.status === '결제완료' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={styles.cancelButton}
                        isLoading={cancelMutation.isPending && cancelMutation.variables === order.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(order);
                        }}
                      >
                        주문취소
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} readOnly />
      )}
    </div>
  );
};

function monthsAgo(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

interface DateSelectProps {
  parts: DateParts;
  onChange: (parts: DateParts) => void;
}

const DateSelect = ({ parts, onChange }: DateSelectProps) => (
  <>
    <select value={parts.y} onChange={(e) => onChange({ ...parts, y: Number(e.target.value) })}>
      {YEAR_OPTIONS.map((y) => (
        <option key={y} value={y}>
          {y}년
        </option>
      ))}
    </select>
    <select value={parts.m} onChange={(e) => onChange({ ...parts, m: Number(e.target.value) })}>
      {MONTH_OPTIONS.map((m) => (
        <option key={m} value={m}>
          {m}월
        </option>
      ))}
    </select>
    <select value={parts.d} onChange={(e) => onChange({ ...parts, d: Number(e.target.value) })}>
      {DAY_OPTIONS.map((d) => (
        <option key={d} value={d}>
          {d}일
        </option>
      ))}
    </select>
  </>
);
