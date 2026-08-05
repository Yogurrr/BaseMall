import { Link } from 'react-router-dom';
import { ProductThumb } from '../ProductThumb/ProductThumb';
import { formatPrice } from '../../api/productApi';
import type { CartItem } from '../../types/cart';
import styles from './CartItemRow.module.css';

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange?: (cartItemId: number, quantity: number) => void;
  onRemove?: (cartItemId: number) => void;
  readOnly?: boolean;
}

export const CartItemRow = ({ item, onQuantityChange, onRemove, readOnly }: CartItemRowProps) => {
  const hasOptions = item.size || item.markingName;

  return (
    <article className={readOnly ? `${styles.row} ${styles.readOnly}` : styles.row}>
      <Link to={`/products/${item.id}`} className={styles.thumb}>
        <ProductThumb imageUrl={item.imageUrl} alt={item.name} size="lg" />
      </Link>

      <div className={styles.info}>
        <p className={styles.category}>{item.category}</p>
        <Link to={`/products/${item.id}`} className={styles.name}>
          {item.name}
        </Link>
        {hasOptions && (
          <p className={styles.options}>
            {[item.size && `사이즈 ${item.size}`, item.markingName && `마킹 ${item.markingName}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        <p className={styles.unitPrice}>{formatPrice(item.price)}</p>
      </div>

      {readOnly ? (
        <p className={styles.quantityText}>{item.quantity}개</p>
      ) : (
        <div className={styles.stepper}>
          <button
            type="button"
            onClick={() => onQuantityChange?.(item.cartItemId, item.quantity - 1)}
            aria-label="수량 감소"
          >
            −
          </button>
          <span>{item.quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange?.(item.cartItemId, item.quantity + 1)}
            aria-label="수량 증가"
          >
            +
          </button>
        </div>
      )}

      <p className={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</p>

      {!readOnly && (
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => onRemove?.(item.cartItemId)}
          aria-label="삭제"
        >
          ✕
        </button>
      )}
    </article>
  );
};
