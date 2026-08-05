import { Button } from '../Button/Button';
import styles from './InfoModal.module.css';

interface InfoModalProps {
  message: string;
  onClose: () => void;
}

export const InfoModal = ({ message, onClose }: InfoModalProps) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={message}
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
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button type="button" size="md" onClick={onClose}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
};
