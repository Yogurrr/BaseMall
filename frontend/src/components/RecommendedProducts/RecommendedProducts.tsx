import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../ProductCard/ProductCard';
import { Spinner } from '../Spinner/Spinner';
import { useWishlist } from '../../context/WishlistContext';
import { fetchProductsPage } from '../../api/productApi';
import styles from './RecommendedProducts.module.css';

interface RecommendedProductsProps {
  team: string;
}

const SIZE = 4;

export const RecommendedProducts = ({ team }: RecommendedProductsProps) => {
  const { isLiked, toggleWishlist } = useWishlist();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', 'recommended', team],
    queryFn: () => fetchProductsPage({ page: 0, size: SIZE, team }),
  });

  const products = data?.content ?? [];

  if (!isLoading && !isError && products.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.recommendedTitle}>⚾ {team} 추천 상품</div>
      {isLoading ? (
        <div className={styles.empty}>
          <Spinner />
        </div>
      ) : isError ? (
        <p className={styles.empty}>추천 상품을 불러오지 못했습니다.</p>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              liked={isLiked(product.id)}
              onToggleLike={toggleWishlist}
            />
          ))}
        </div>
      )}
    </section>
  );
};
