import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { Button } from '../components/Button/Button';
import { Spinner } from '../components/Spinner/Spinner';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { fetchProduct, formatPrice } from '../api/productApi';
import styles from './ProductDetail.module.css';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isLiked, toggleWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    enabled: Number.isFinite(productId),
  });

  const discountPercent = product?.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.min(99, Math.max(1, prev + delta)));
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    setAddedMessage(true);
    window.setTimeout(() => setAddedMessage(false), 1500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, quantity);
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
          <span className={styles.breadcrumbCurrent}>{product?.name ?? '상세정보'}</span>
        </nav>

        {isLoading ? (
          <div className={styles.empty}><Spinner /></div>
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
              <span>{product.emoji}</span>
              {product.badge && (
                <span className={`${styles.badge} ${styles[`badge${product.badge}`]}`}>{product.badge}</span>
              )}
            </div>

            <div className={styles.info}>
              <p className={styles.category}>
                {product.category}
                {product.team && <span className={styles.team}> · {product.team}</span>}
              </p>
              <h1 className={styles.title}>{product.name}</h1>
              <p className={styles.rating}>
                ⭐ {product.rating} <span className={styles.reviewCount}>({product.reviewCount}개 리뷰)</span>
              </p>

              <div className={styles.priceRow}>
                {discountPercent > 0 && <span className={styles.discount}>{discountPercent}%</span>}
                <span className={styles.price}>{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
                )}
              </div>

              <div className={styles.quantityRow}>
                <span>수량</span>
                <div className={styles.stepper}>
                  <button type="button" onClick={() => handleQuantityChange(-1)} aria-label="수량 감소">
                    −
                  </button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => handleQuantityChange(1)} aria-label="수량 증가">
                    +
                  </button>
                </div>
              </div>

              <p className={styles.totalPrice}>총 금액 {formatPrice(product.price * quantity)}</p>

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

              {addedMessage && <p className={styles.toast}>장바구니에 담았습니다.</p>}

              <Link to="/" className={styles.backLink}>
                ← 목록으로 돌아가기
              </Link>
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
};
