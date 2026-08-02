import { ProductCard } from '../../components/ProductCard/ProductCard';
import { Spinner } from '../../components/Spinner/Spinner';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import styles from './MyPage.module.css';

export const MyPageWishlist = () => {
  const { addItem } = useCart();
  const { items: wishlistItems, isLoading, toggleWishlist } = useWishlist();

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>나의 위시리스트</p>

      {isLoading ? (
        <div className={styles.empty}>
          <Spinner />
        </div>
      ) : wishlistItems.length === 0 ? (
        <p className={styles.empty}>찜한 상품이 없습니다.</p>
      ) : (
        <div className={styles.wishlistGrid}>
          {wishlistItems.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              liked
              onToggleLike={toggleWishlist}
              onAddToCart={(p) => addItem(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
