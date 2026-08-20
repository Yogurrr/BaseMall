import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order } from '../../types/order';
import { formatPrice } from '../../api/productApi';
import { cancelOrder } from '../../api/orderApi';
import { OrderDetailModal } from '../OrderDetailModal/OrderDetailModal';
import { ProductThumb } from '../ProductThumb/ProductThumb';
import { Button } from '../Button/Button';
import { MonthRangeFilter } from '../MonthRangeFilter/MonthRangeFilter';
import { defaultMonthRange, type DateRange } from '../../utils/dateRange';
import styles from './OrderHistoryPanel.module.css';

interface OrderHistoryPanelProps {
  orders: Order[];
}

const formatOrderDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export const OrderHistoryPanel = ({ orders }: OrderHistoryPanelProps) => {
  const [appliedRange, setAppliedRange] = useState<DateRange>(defaultMonthRange);
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
      <MonthRangeFilter
        label="구매기간"
        notice="최근 5년 이내 주문 내역만 조회할 수 있습니다."
        onApply={setAppliedRange}
      />

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
