import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QuickLinkCard } from '../../components/QuickLinkCard/QuickLinkCard';
import { MyPageBanner } from '../../components/MyPageBanner/MyPageBanner';
import { MyPageStatsBar } from '../../components/MyPageStatsBar/MyPageStatsBar';
import { OrderStatusOverview } from '../../components/OrderStatusOverview/OrderStatusOverview';
import { WishlistPreview } from '../../components/WishlistPreview/WishlistPreview';
import { AddToCartModal } from '../../components/AddToCartModal/AddToCartModal';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAddToCartModal } from '../../hooks/useAddToCartModal';
import { fetchMyOrders } from '../../api/orderApi';
import { fetchMyCoupons } from '../../api/couponApi';
import type { UserInfo } from '../../types/user';
import styles from './MyPage.module.css';

export const MyPageHome = () => {
  const currentUser = useOutletContext<UserInfo>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { items: wishlistItems, toggleWishlist } = useWishlist();
  const {
    isAddToCartModalOpen,
    openAddToCartModal,
    closeAddToCartModal,
    goToCheckout,
  } = useAddToCartModal();

  const { data: myOrders = [] } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: fetchMyOrders,
  });
  const { data: myCoupons = [] } = useQuery({
    queryKey: ['coupons', 'me'],
    queryFn: fetchMyCoupons,
  });
  const unusedCouponCount = myCoupons.filter((coupon) => !coupon.usedAt).length;

  return (
    <>
      <MyPageBanner
        name={currentUser.name}
        role={currentUser.role}
        team={currentUser.favoriteTeam}
        grade={currentUser.grade}
        onSelectWishlist={() => navigate('/mypage/wishlist')}
        onSelectProfile={() => navigate('/mypage/profile-edit')}
      />

      <MyPageStatsBar
        wishlistCount={wishlistItems.length}
        couponCount={unusedCouponCount}
      />

      <OrderStatusOverview
        orders={myOrders}
        onMore={() => navigate('/mypage/orders')}
      />

      <WishlistPreview
        products={wishlistItems}
        onToggleLike={toggleWishlist}
        onAddToCart={(p) => {
          addItem(p);
          openAddToCartModal();
        }}
        onMore={() => navigate('/mypage/wishlist')}
      />

      {currentUser.role === 'ADMIN' && (
        <div className={styles.linkGrid}>
          <QuickLinkCard
            icon="🛠️"
            label="관리자 페이지"
            description="상품 · 회원 관리"
            to="/admin"
          />
        </div>
      )}

      {isAddToCartModalOpen && (
        <AddToCartModal
          onClose={closeAddToCartModal}
          onCheckout={goToCheckout}
        />
      )}
    </>
  );
};
