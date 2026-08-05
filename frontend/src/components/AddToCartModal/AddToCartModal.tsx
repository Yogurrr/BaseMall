import { Button } from '../Button/Button';
import styles from './AddToCartModal.module.css';

interface AddToCartModalProps {
  onClose: () => void;
  onCheckout: () => void;
}

export const AddToCartModal = ({ onClose, onCheckout }: AddToCartModalProps) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="장바구니에 담았습니다"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#22c55e" />
          <path
            d="M7 12.5l3 3 7-7"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className={styles.message}>장바구니에 담았습니다.</p>
        <p className={styles.subMessage}>계속 쇼핑하시겠어요, 결제하러 가시겠어요?</p>
        <div className={styles.actions}>
          <Button type="button" size="md" variant="outline" onClick={onClose}>
            계속 쇼핑하기
          </Button>
          <Button type="button" size="md" onClick={onCheckout}>
            결제하러 가기
          </Button>
        </div>
      </div>
    </div>
  );
};
