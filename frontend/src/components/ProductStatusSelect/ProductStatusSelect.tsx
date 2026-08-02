import { PRODUCT_STATUSES } from '../../api/productApi';
import type { ProductStatus } from '../../types/product';
import styles from './ProductStatusSelect.module.css';

interface ProductStatusSelectProps {
  value: ProductStatus;
  onSave: (value: ProductStatus) => void;
  isSaving?: boolean;
}

const STATUS_CLASS: Record<ProductStatus, string> = {
  판매중: styles.onSale,
  판매중지: styles.suspended,
  품절: styles.soldOut,
};

export const ProductStatusSelect = ({ value, onSave, isSaving }: ProductStatusSelectProps) => (
  <select
    className={`${styles.select} ${STATUS_CLASS[value]}`}
    value={value}
    disabled={isSaving}
    onChange={(e) => onSave(e.target.value as ProductStatus)}
    aria-label="판매 상태"
  >
    {PRODUCT_STATUSES.map((status) => (
      <option key={status} value={status}>
        {status}
      </option>
    ))}
  </select>
);
