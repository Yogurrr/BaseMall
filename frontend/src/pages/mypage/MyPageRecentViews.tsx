import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../../components/ProductCard/ProductCard';
import { Spinner } from '../../components/Spinner/Spinner';
import { AddToCartModal } from '../../components/AddToCartModal/AddToCartModal';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAddToCartModal } from '../../hooks/useAddToCartModal';
import { fetchRecentViews } from '../../api/recentViewApi';
import styles from './MyPage.module.css';

export const MyPageRecentViews = () => {
  const { addItem } = useCart();
  const { isLiked, toggleWishlist } = useWishlist();
  const {
    isAddToCartModalOpen,
    openAddToCartModal,
    closeAddToCartModal,
    goToCheckout,
  } = useAddToCartModal();

  const { data: recentViews = [], isLoading } = useQuery({
    queryKey: ['recent-views'],
    queryFn: fetchRecentViews,
  });

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>최근 본 상품</p>

      {isLoading ? (
        <div className={styles.empty}>
          <Spinner />
        </div>
      ) : recentViews.length === 0 ? (
        <p className={styles.empty}>최근 본 상품이 없습니다.</p>
      ) : (
        <div className={styles.wishlistGrid}>
          {recentViews.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              liked={isLiked(product.id)}
              onToggleLike={toggleWishlist}
              onAddToCart={(p) => {
                addItem(p);
                openAddToCartModal();
              }}
            />
          ))}
        </div>
      )}

      {isAddToCartModalOpen && (
        <AddToCartModal
          onClose={closeAddToCartModal}
          onCheckout={goToCheckout}
        />
      )}
    </div>
  );
};
