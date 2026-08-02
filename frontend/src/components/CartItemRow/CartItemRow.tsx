import { Link } from 'react-router-dom';
import { formatPrice } from '../../api/productApi';
import type { CartItem } from '../../types/cart';
import styles from './CartItemRow.module.css';

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export const CartItemRow = ({ item, onQuantityChange, onRemove }: CartItemRowProps) => {
  return (
    <article className={styles.row}>
      <Link to={`/products/${item.id}`} className={styles.thumb}>
        <span>{item.emoji}</span>
      </Link>

      <div className={styles.info}>
        <p className={styles.category}>{item.category}</p>
        <Link to={`/products/${item.id}`} className={styles.name}>
          {item.name}
        </Link>
        <p className={styles.unitPrice}>{formatPrice(item.price)}</p>
      </div>

      <div className={styles.stepper}>
        <button type="button" onClick={() => onQuantityChange(item.id, item.quantity - 1)} aria-label="수량 감소">
          −
        </button>
        <span>{item.quantity}</span>
        <button type="button" onClick={() => onQuantityChange(item.id, item.quantity + 1)} aria-label="수량 증가">
          +
        </button>
      </div>

      <p className={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</p>

      <button type="button" className={styles.removeButton} onClick={() => onRemove(item.id)} aria-label="삭제">
        ✕
      </button>
    </article>
  );
};
