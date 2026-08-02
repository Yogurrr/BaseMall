import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../Button/Button';
import { updateTrackingNumber } from '../../api/orderApi';
import type { Order } from '../../types/order';
import { formatPrice } from '../../api/productApi';
import styles from './OrderDetailModal.module.css';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  readOnly?: boolean;
}

export const OrderDetailModal = ({ order, onClose, readOnly = false }: OrderDetailModalProps) => {
  const queryClient = useQueryClient();
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber ?? '');

  useEffect(() => {
    setTrackingInput(order.trackingNumber ?? '');
  }, [order.trackingNumber]);

  const trackingMutation = useMutation({
    mutationFn: (trackingNumber: string) => updateTrackingNumber(order.id, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleTrackingSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (trackingInput.trim() === (order.trackingNumber ?? '')) return;
    trackingMutation.mutate(trackingInput.trim());
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="order-detail-title">주문 #{order.id}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <dl className={styles.infoGrid}>
          <dt>주문 상태</dt>
          <dd>{order.status}</dd>
          <dt>주문일시</dt>
          <dd>{new Date(order.createdAt).toLocaleString('ko-KR')}</dd>
          <dt>주문자</dt>
          <dd>{order.buyerName}</dd>
          <dt>이메일</dt>
          <dd>{order.buyerEmail}</dd>
          <dt>배송지</dt>
          <dd>{order.shippingAddress ?? '-'}</dd>
        </dl>

        {readOnly ? (
          <dl className={styles.infoGrid}>
            <dt>운송장 번호</dt>
            <dd>{order.trackingNumber ?? '아직 등록되지 않았습니다'}</dd>
          </dl>
        ) : (
          <form className={styles.trackingField} onSubmit={handleTrackingSubmit}>
            <label htmlFor="tracking-number">운송장 번호</label>
            <div className={styles.trackingInputRow}>
              <input
                id="tracking-number"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="운송장 번호를 입력하세요"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                isLoading={trackingMutation.isPending}
                disabled={trackingInput.trim() === (order.trackingNumber ?? '')}
              >
                저장
              </Button>
            </div>
            {trackingMutation.isError && <p className={styles.trackingError}>운송장 번호 저장에 실패했습니다.</p>}
          </form>
        )}

        <table className={styles.itemTable}>
          <thead>
            <tr>
              <th>상품</th>
              <th>단가</th>
              <th>수량</th>
              <th>소계</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>
                  {item.emoji} {item.name}
                  {item.category && <span className={styles.itemCategory}>{item.category}</span>}
                </td>
                <td>{formatPrice(item.price)}</td>
                <td>{item.quantity}</td>
                <td>{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totalRow}>
          <span>총 결제 금액</span>
          <strong>{formatPrice(order.totalPrice)}</strong>
        </div>
      </div>
    </div>
  );
};
