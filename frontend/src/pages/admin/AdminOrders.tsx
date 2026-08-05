import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { SelectFilter } from '../../components/SelectFilter/SelectFilter';
import { Pagination } from '../../components/Pagination/Pagination';
import { OrderDetailModal } from '../../components/OrderDetailModal/OrderDetailModal';
import { ProductThumb } from '../../components/ProductThumb/ProductThumb';
import { ORDER_STATUSES, fetchOrders, updateOrderStatus } from '../../api/orderApi';
import { formatPrice } from '../../api/productApi';
import type { Order } from '../../types/order';
import styles from './Admin.module.css';

const ORDER_STATUS_FILTERS = ['전체', ...ORDER_STATUSES];
const ORDERS_PAGE_SIZE = 10;

export const AdminOrders = () => {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });
  const [statusFilter, setStatusFilter] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(0);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const trimmedKeyword = keyword.trim().toLowerCase();
  const filteredOrders = orders
    .filter((order) => statusFilter === '전체' || order.status === statusFilter)
    .filter((order) => {
      if (!trimmedKeyword) return true;
      const orderNumber = `#${order.id}`;
      const haystack = [
        orderNumber,
        String(order.id),
        order.buyerName,
        order.buyerEmail,
        ...order.items.map((item) => item.name),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(trimmedKeyword);
    });

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PAGE_SIZE);
  const pagedOrders = filteredOrders.slice(page * ORDERS_PAGE_SIZE, page * ORDERS_PAGE_SIZE + ORDERS_PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, trimmedKeyword]);

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>주문 관리</h1>
      </div>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>전체 주문</span>
          <strong>{orders.length}건</strong>
        </div>
        <div className={styles.statCard}>
          <span>주문 총액</span>
          <strong>{formatPrice(totalRevenue)}</strong>
        </div>
      </section>

      <div className={styles.filterBar}>
        <SelectFilter options={ORDER_STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        <input
          type="search"
          className={styles.searchInput}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="주문번호, 주문자, 이메일, 상품명으로 검색"
          aria-label="주문 검색"
        />
      </div>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : isError ? (
          <p className={`${styles.empty} ${styles.error}`}>주문 목록을 불러오지 못했습니다.</p>
        ) : orders.length === 0 ? (
          <p className={styles.empty}>주문 내역이 없습니다.</p>
        ) : filteredOrders.length === 0 ? (
          <p className={styles.empty}>
            {trimmedKeyword ? `'${keyword}'에 대한 검색 결과가 없습니다.` : `'${statusFilter}' 상태의 주문이 없습니다.`}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문자</th>
                <th>상품</th>
                <th>금액</th>
                <th>주문일시</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    {order.buyerName}
                    <div className={styles.orderBuyerEmail}>{order.buyerEmail}</div>
                  </td>
                  <td>
                    {order.items.map((item, index) => (
                      <div key={index}>
                        <ProductThumb imageUrl={item.imageUrl} alt={item.name} size="sm" /> {item.name} × {item.quantity}
                        {(item.size || item.markingName) && (
                          <span className={styles.orderBuyerEmail}>
                            {' '}
                            ({[item.size && `사이즈 ${item.size}`, item.markingName && `마킹 ${item.markingName}`]
                              .filter(Boolean)
                              .join(' · ')})
                          </span>
                        )}
                      </div>
                    ))}
                  </td>
                  <td>{formatPrice(order.totalPrice)}</td>
                  <td>{new Date(order.createdAt).toLocaleString('ko-KR')}</td>
                  <td>
                    <select
                      value={order.status}
                      disabled={statusMutation.isPending && statusMutation.variables?.id === order.id}
                      onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value })}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                      상세보기
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !isError && filteredOrders.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </>
  );
};
