import type { Inquiry } from '../../types/inquiry';
import styles from './InquiryListPanel.module.css';

interface InquiryListPanelProps {
  inquiries: Inquiry[];
  onSelect: (inquiry: Inquiry) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export const InquiryListPanel = ({ inquiries, onSelect }: InquiryListPanelProps) => {
  if (inquiries.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>!</span>
        <p>작성한 문의가 없습니다</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {inquiries.map((inquiry) => (
        <li key={inquiry.id} className={styles.row} onClick={() => onSelect(inquiry)}>
          <div className={styles.info}>
            <div className={styles.metaRow}>
              <span className={styles.category}>{inquiry.category}</span>
              <span className={inquiry.status === '답변완료' ? styles.statusDone : styles.statusPending}>
                {inquiry.status}
              </span>
            </div>
            <p className={styles.title}>{inquiry.title}</p>
            <p className={styles.date}>{formatDate(inquiry.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};
