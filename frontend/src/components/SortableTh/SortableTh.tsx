import styles from './SortableTh.module.css';

interface SortableThProps {
  label: string;
  active: boolean;
  direction: 'asc' | 'desc';
  onClick: () => void;
}

export const SortableTh = ({ label, active, direction, onClick }: SortableThProps) => (
  <th>
    <button type="button" className={styles.sortButton} onClick={onClick}>
      {label}
      <span className={`${styles.arrow} ${active ? styles.arrowActive : ''}`}>
        {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </button>
  </th>
);
