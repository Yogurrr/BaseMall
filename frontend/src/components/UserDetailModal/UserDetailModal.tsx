import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../Spinner/Spinner';
import { Button } from '../Button/Button';
import { OrderDetailModal } from '../OrderDetailModal/OrderDetailModal';
import { fetchUserById } from '../../api/userApi';
import { fetchOrdersByUserId } from '../../api/orderApi';
import { formatPrice } from '../../api/productApi';
import type { Order } from '../../types/order';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import styles from './UserDetailModal.module.css';

interface UserDetailModalProps {
  userId: number;
  onClose: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: '관리자',
  USER: '일반회원',
};

export const UserDetailModal = ({ userId, onClose }: UserDetailModalProps) => {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId),
  });

  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useQuery({
    queryKey: ['user-orders', userId],
    queryFn: () => fetchOrdersByUserId(userId),
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="user-detail-title">회원 상세 정보</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError || !user ? (
          <p>회원 정보를 불러오지 못했습니다.</p>
        ) : (
          <dl className={styles.infoGrid}>
            <dt>ID</dt>
            <dd>{user.id}</dd>
            <dt>이름</dt>
            <dd>{user.name}</dd>
            <dt>이메일</dt>
            <dd>{user.email}</dd>
            <dt>구분</dt>
            <dd>{ROLE_LABEL[user.role] ?? user.role}</dd>
            <dt>응원팀</dt>
            <dd>{user.favoriteTeam ?? '-'}</dd>
            <dt>등급</dt>
            <dd>{user.grade ?? '-'}</dd>
            <dt>적립금</dt>
            <dd>{formatPrice(user.points)}</dd>
            <dt>가입일</dt>
            <dd>{formatDateTime(user.createdAt)}</dd>
            <dt>상태</dt>
            <dd>
              <span
                className={`${styles.statusBadge} ${user.useAt === 'Y' ? styles.statusActive : styles.statusWithdrawn}`}
              >
                {user.useAt === 'Y' ? '활동중' : '탈퇴'}
              </span>
            </dd>
            {user.useAt === 'N' && user.withdrawnAt && (
              <>
                <dt>탈퇴일</dt>
                <dd>{formatDateTime(user.withdrawnAt)}</dd>
              </>
            )}
          </dl>
        )}

        <div className={styles.ordersSection}>
          <h3 className={styles.ordersTitle}>
            주문 내역{orders && ` (${orders.length}건)`}
          </h3>
          {ordersLoading ? (
            <Spinner size={20} />
          ) : ordersError ? (
            <p>주문 내역을 불러오지 못했습니다.</p>
          ) : !orders || orders.length === 0 ? (
            <p className={styles.ordersEmpty}>주문 내역이 없습니다.</p>
          ) : (
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>주문일시</th>
                  <th>금액</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{formatPrice(order.totalPrice)}</td>
                    <td>{order.status}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        상세보기
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          readOnly
        />
      )}
    </div>
  );
};
