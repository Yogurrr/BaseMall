import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QuickLinkCard } from '../../components/QuickLinkCard/QuickLinkCard';
import { MyPageBanner } from '../../components/MyPageBanner/MyPageBanner';
import { MyPageStatsBar } from '../../components/MyPageStatsBar/MyPageStatsBar';
import { OrderStatusOverview } from '../../components/OrderStatusOverview/OrderStatusOverview';
import { WishlistPreview } from '../../components/WishlistPreview/WishlistPreview';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { fetchMyOrders } from '../../api/orderApi';
import type { UserInfo } from '../../types/user';
import styles from './MyPage.module.css';

export const MyPageHome = () => {
  const currentUser = useOutletContext<UserInfo>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { items: wishlistItems, toggleWishlist } = useWishlist();

  const { data: myOrders = [] } = useQuery({ queryKey: ['orders', 'me'], queryFn: fetchMyOrders });

  return (
    <>
      <MyPageBanner
        name={currentUser.name}
        role={currentUser.role}
        team={currentUser.favoriteTeam}
        onSelectWishlist={() => navigate('/mypage/wishlist')}
        onSelectProfile={() => navigate('/mypage/profile-edit')}
      />

      <MyPageStatsBar wishlistCount={wishlistItems.length} />

      <OrderStatusOverview orders={myOrders} onMore={() => navigate('/mypage/orders')} />

      <WishlistPreview
        products={wishlistItems}
        onToggleLike={toggleWishlist}
        onAddToCart={(p) => addItem(p)}
        onMore={() => navigate('/mypage/wishlist')}
      />

      {currentUser.role === 'ADMIN' && (
        <div className={styles.linkGrid}>
          <QuickLinkCard icon="🛠️" label="관리자 페이지" description="상품 · 회원 관리" to="/admin" />
        </div>
      )}
    </>
  );
};
