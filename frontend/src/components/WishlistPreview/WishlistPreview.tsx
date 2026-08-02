import type { Product } from '../../types/product';
import { ProductCard } from '../ProductCard/ProductCard';
import styles from './WishlistPreview.module.css';

interface WishlistPreviewProps {
  products: Product[];
  onToggleLike: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onMore: () => void;
}

const PREVIEW_SIZE = 4;

export const WishlistPreview = ({ products, onToggleLike, onAddToCart, onMore }: WishlistPreviewProps) => (
  <section className={styles.section}>
    <div className={styles.header}>
      <p className={styles.title}>좋아요</p>
      <button type="button" className={styles.more} onClick={onMore}>
        더보기 ›
      </button>
    </div>

    {products.length === 0 ? (
      <p className={styles.empty}>찜한 상품이 없습니다.</p>
    ) : (
      <div className={styles.grid}>
        {products.slice(0, PREVIEW_SIZE).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            liked
            onToggleLike={onToggleLike}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    )}
  </section>
);
