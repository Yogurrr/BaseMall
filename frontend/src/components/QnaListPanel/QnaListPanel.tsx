import { Link } from 'react-router-dom';
import { ProductThumb } from '../ProductThumb/ProductThumb';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import type { MyQna } from '../../types/qna';
import styles from './QnaListPanel.module.css';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

interface QnaListPanelProps {
  qnas: MyQna[];
  emptyMessage: string;
}

export const QnaListPanel = ({ qnas, emptyMessage }: QnaListPanelProps) => {
  if (qnas.length === 0) {
    return (
      <div className={styles.empty}>
        <StatusMessage icon="❓">{emptyMessage}</StatusMessage>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {qnas.map((qna) => (
        <li key={qna.id} className={styles.card}>
          <Link to={`/products/${qna.productId}`} className={styles.thumb}>
            <ProductThumb imageUrl={qna.productImageUrl} alt={qna.productName} size="lg" />
          </Link>
          <div className={styles.info}>
            <div className={styles.metaRow}>
              <Link to={`/products/${qna.productId}`} className={styles.productName}>
                {qna.productName}
              </Link>
              <span className={qna.status === '답변완료' ? styles.statusDone : styles.statusPending}>
                {qna.status}
              </span>
            </div>
            <p className={styles.question}>Q. {qna.question}</p>
            {qna.answer && <p className={styles.answer}>A. {qna.answer}</p>}
            <p className={styles.meta}>{formatDate(qna.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};
