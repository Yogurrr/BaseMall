import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../Button/Button';
import { ProductThumb } from '../ProductThumb/ProductThumb';
import { formatPrice } from '../../api/productApi';
import { fetchBadges, getBadgeGradient } from '../../api/badgeApi';
import type { Product } from '../../types/product';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  liked: boolean;
  onToggleLike: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard = ({ product, liked, onToggleLike, onAddToCart }: ProductCardProps) => {
  const { data: badges = [] } = useQuery({ queryKey: ['badges'], queryFn: fetchBadges, staleTime: 5 * 60 * 1000 });
  const discountPercent = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <article className={styles.card}>
      <Link to={`/products/${product.id}`} className={styles.thumb}>
        <ProductThumb imageUrl={product.imageUrl} alt={product.name} size="lg" />
        {product.badge && (
          <span className={styles.badge} style={{ background: getBadgeGradient(badges, product.badge) }}>
            {product.badge}
          </span>
        )}
        <button
          type="button"
          className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ''}`}
          aria-label="찜하기"
          aria-pressed={liked}
          onClick={(e) => {
            e.preventDefault();
            onToggleLike(product);
          }}
        >
          {liked ? '❤️' : '🤍'}
        </button>
      </Link>
      <div className={styles.cardBody}>
        <p className={styles.category}>
          {product.category}
          {product.team && <span className={styles.team}> · {product.team}</span>}
        </p>
        <h3>
          <Link to={`/products/${product.id}`} className={styles.titleLink}>
            {product.name}
          </Link>
        </h3>
        <p className={styles.rating}>
          ⭐ {product.rating} ({product.reviewCount})
        </p>
        <div className={styles.priceRow}>
          {discountPercent > 0 && <span className={styles.discount}>{discountPercent}%</span>}
          <span className={styles.price}>{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
          )}
        </div>
        {onAddToCart && (
          <Button size="sm" onClick={() => onAddToCart(product)}>
            🛒 장바구니 담기
          </Button>
        )}
      </div>
    </article>
  );
};
