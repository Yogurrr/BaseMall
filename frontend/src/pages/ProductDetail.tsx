import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { Button } from '../components/Button/Button';
import { Spinner } from '../components/Spinner/Spinner';
import { ProductThumb } from '../components/ProductThumb/ProductThumb';
import { ProductReviews } from '../components/ProductReviews/ProductReviews';
import { ProductQna } from '../components/ProductQna/ProductQna';
import { AddToCartModal } from '../components/AddToCartModal/AddToCartModal';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAddToCartModal } from '../hooks/useAddToCartModal';
import { fetchProduct, formatPrice } from '../api/productApi';
import { fetchBadges, getBadgeGradient } from '../api/badgeApi';
import { recordRecentView } from '../api/recentViewApi';
import { isLoggedIn } from '../api/authToken';
import {
  UNIFORM_CATEGORY_NAME,
  UNIFORM_MARKING_NAMES,
  UNIFORM_SIZES,
} from '../constants/uniformOptions';
import styles from './ProductDetail.module.css';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isLiked, toggleWishlist } = useWishlist();
  const {
    isAddToCartModalOpen,
    openAddToCartModal,
    closeAddToCartModal,
    goToCheckout,
  } = useAddToCartModal();

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string>(UNIFORM_SIZES[0]);
  const [markingName, setMarkingName] = useState<string>(
    UNIFORM_MARKING_NAMES[0],
  );

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    enabled: Number.isFinite(productId),
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: fetchBadges,
    staleTime: 5 * 60 * 1000,
  });

  // 💡 로그인 사용자가 상품 상세를 실제로 조회했을 때만 "최근 본 상품" 이력을 남긴다(비로그인은 대상 없음).
  useEffect(() => {
    if (!product || !isLoggedIn()) return;
    recordRecentView(product.id).catch(() => {});
  }, [product]);

  const isUniform = product?.category === UNIFORM_CATEGORY_NAME;

  const discountPercent = product?.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.min(99, Math.max(1, prev + delta)));
  };

  const uniformOptions = isUniform ? { size, markingName } : undefined;

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, uniformOptions);
    openAddToCartModal();
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, quantity, uniformOptions);
    navigate('/cart');
  };

  return (
    <div className={styles.page}>
      <SiteHeader />

      <div className={styles.content}>
        <nav className={styles.breadcrumb}>
          <Link to="/">홈</Link>
          <span>/</span>
          {product ? <span>{product.category}</span> : <span>상품</span>}
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>
            {product?.name ?? '상세정보'}
          </span>
        </nav>

        {isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : isError || !product ? (
          <div className={styles.empty}>
            <p>상품을 찾을 수 없습니다.</p>
            <Link to="/" className={styles.backLink}>
              ← 목록으로 돌아가기
            </Link>
          </div>
        ) : (
          <div className={styles.detail}>
            <div className={styles.thumb}>
              <ProductThumb
                imageUrl={product.imageUrl}
                alt={product.name}
                size="lg"
              />
              {product.badge && (
                <span
                  className={styles.badge}
                  style={{
                    background: getBadgeGradient(badges, product.badge),
                  }}
                >
                  {product.badge}
                </span>
              )}
            </div>

            <div className={styles.info}>
              <p className={styles.category}>
                {product.category}
                {product.team && (
                  <span className={styles.team}> · {product.team}</span>
                )}
              </p>
              <h1 className={styles.title}>{product.name}</h1>
              <p className={styles.rating}>
                ⭐ {product.rating}{' '}
                <span className={styles.reviewCount}>
                  ({product.reviewCount}개 리뷰)
                </span>
              </p>

              <div className={styles.priceRow}>
                {discountPercent > 0 && (
                  <span className={styles.discount}>{discountPercent}%</span>
                )}
                <span className={styles.price}>
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className={styles.originalPrice}>
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {isUniform && (
                <div className={styles.optionGroup}>
                  <div className={styles.optionRow}>
                    <span>사이즈</span>
                    <select
                      className={styles.optionSelect}
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      aria-label="사이즈 선택"
                    >
                      {UNIFORM_SIZES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.optionRow}>
                    <span>마킹 선수 이름</span>
                    <select
                      className={styles.optionSelect}
                      value={markingName}
                      onChange={(e) => setMarkingName(e.target.value)}
                      aria-label="마킹 선수 이름 선택"
                    >
                      {UNIFORM_MARKING_NAMES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className={styles.quantityRow}>
                <span>수량</span>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    aria-label="수량 감소"
                  >
                    −
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    aria-label="수량 증가"
                  >
                    +
                  </button>
                </div>
              </div>

              <p className={styles.totalPrice}>
                총 금액 {formatPrice(product.price * quantity)}
              </p>

              <div className={styles.actions}>
                <Button size="lg" onClick={handleBuyNow}>
                  ⚡ 바로 결제
                </Button>
                <Button size="lg" variant="secondary" onClick={handleAddToCart}>
                  🛒 장바구니 담기
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => toggleWishlist(product)}
                  aria-pressed={isLiked(product.id)}
                >
                  {isLiked(product.id) ? '❤️ 찜 완료' : '🤍 찜하기'}
                </Button>
              </div>

              <Link to="/" className={styles.backLink}>
                ← 목록으로 돌아가기
              </Link>
            </div>
          </div>
        )}

        {!isLoading &&
          !isError &&
          product &&
          (product.description || product.detailImageUrl) && (
            <section className={styles.description}>
              <h2 className={styles.descriptionTitle}>상세 설명</h2>
              {product.detailImageUrl && (
                <img
                  src={product.detailImageUrl}
                  alt={`${product.name} 상세 이미지`}
                  className={styles.descriptionImage}
                />
              )}
              {product.description && (
                <p className={styles.descriptionText}>{product.description}</p>
              )}
            </section>
          )}

        {!isLoading && !isError && product && (
          <ProductReviews productId={product.id} />
        )}
        {!isLoading && !isError && product && (
          <ProductQna productId={product.id} />
        )}
      </div>

      <SiteFooter />

      {isAddToCartModalOpen && (
        <AddToCartModal
          onClose={closeAddToCartModal}
          onCheckout={goToCheckout}
        />
      )}
    </div>
  );
};
