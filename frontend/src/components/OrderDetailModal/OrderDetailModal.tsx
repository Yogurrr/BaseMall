import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../Button/Button';
import { ProductThumb } from '../ProductThumb/ProductThumb';
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
  // 💡 order.trackingNumber는 저장 성공 후 캐시 무효화로 뒤늦게 갱신될 수 있다.
  // effect 대신 렌더링 중에 이전 값과 비교해 바뀐 경우에만 입력값을 다시 맞춘다
  // (React 문서의 "prop이 바뀔 때 state를 조정하기" 패턴).
  const [prevTrackingNumber, setPrevTrackingNumber] = useState(order.trackingNumber);
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber ?? '');
  if (order.trackingNumber !== prevTrackingNumber) {
    setPrevTrackingNumber(order.trackingNumber);
    setTrackingInput(order.trackingNumber ?? '');
  }

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
          <dt>받는분</dt>
          <dd>{order.recipientName ?? '-'} {order.recipientPhone && `(${order.recipientPhone})`}</dd>
          <dt>배송지</dt>
          <dd>
            {order.zipCode && `(${order.zipCode}) `}
            {order.address ?? '-'} {order.addressDetail}
          </dd>
          <dt>배송 요청사항</dt>
          <dd>{order.deliveryRequest ?? '-'}</dd>
          <dt>공동현관</dt>
          <dd>
            {order.entryMethod ?? '-'}
            {order.entryNote && ` (${order.entryNote})`}
          </dd>
          <dt>결제수단</dt>
          <dd>{order.paymentMethod ?? '-'}</dd>
          {(order.pointsUsed ?? 0) > 0 && (
            <>
              <dt>적립금 사용</dt>
              <dd>{formatPrice(order.pointsUsed ?? 0)}</dd>
            </>
          )}
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
                  <ProductThumb imageUrl={item.imageUrl} alt={item.name} size="sm" /> {item.name}
                  {item.category && <span className={styles.itemCategory}>{item.category}</span>}
                  {(item.size || item.markingName) && (
                    <span className={styles.itemCategory}>
                      {[item.size && `사이즈 ${item.size}`, item.markingName && `마킹 ${item.markingName}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
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
