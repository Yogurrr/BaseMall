import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="상품 목록 페이지">
      <button
        type="button"
        className={styles.pageNav}
        disabled={page === 0}
        onClick={() => onChange(Math.max(0, page - 1))}
      >
        이전
      </button>
      {Array.from({ length: totalPages }, (_, i) => i).map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={`${styles.pageNumber} ${page === pageNumber ? styles.pageNumberActive : ''}`}
          onClick={() => onChange(pageNumber)}
        >
          {pageNumber + 1}
        </button>
      ))}
      <button
        type="button"
        className={styles.pageNav}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
      >
        다음
      </button>
    </nav>
  );
};
