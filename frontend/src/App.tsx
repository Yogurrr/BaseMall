import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Search } from './pages/Search';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { KakaoPayApprove } from './pages/KakaoPayApprove';
import { KakaoPayNotice } from './pages/KakaoPayNotice';
import { TossPayApprove } from './pages/TossPayApprove';
import { TossPayNotice } from './pages/TossPayNotice';
import { MyPageLayout } from './pages/mypage/MyPageLayout';
import { MyPageHome } from './pages/mypage/MyPageHome';
import { MyPageOrders } from './pages/mypage/MyPageOrders';
import { MyPageReturns } from './pages/mypage/MyPageReturns';
import { MyPageWishlist } from './pages/mypage/MyPageWishlist';
import { MyPageReviews } from './pages/mypage/MyPageReviews';
import { MyPageWithdraw } from './pages/mypage/MyPageWithdraw';
import { MyPageCoupons } from './pages/mypage/MyPageCoupons';
import { MyPagePoints } from './pages/mypage/MyPagePoints';
import { MyPageAddresses } from './pages/mypage/MyPageAddresses';
import { MyPagePlaceholder } from './pages/mypage/MyPagePlaceholder';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminProductNew } from './pages/admin/AdminProductNew';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminStats } from './pages/admin/AdminStats';
import { AdminSales } from './pages/admin/AdminSales';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminPlaceholder } from './pages/admin/AdminPlaceholder';
import { Login } from './pages/Login';
import { RequireAuth } from './components/RequireAuth';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

function App() {

  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/kakao/approve" element={<KakaoPayApprove />} />
            <Route path="/checkout/kakao/cancel" element={<KakaoPayNotice status="cancel" />} />
            <Route path="/checkout/kakao/fail" element={<KakaoPayNotice status="fail" />} />
            <Route path="/checkout/toss/approve" element={<TossPayApprove />} />
            <Route path="/checkout/toss/fail" element={<TossPayNotice />} />
            <Route
              path="/mypage"
              element={
                <RequireAuth>
                  <MyPageLayout />
                </RequireAuth>
              }
            >
              <Route index element={<MyPageHome />} />
              <Route path="orders" element={<MyPageOrders />} />
              <Route path="returns" element={<MyPageReturns />} />
              <Route path="wishlist" element={<MyPageWishlist />} />
              <Route path="reviews" element={<MyPageReviews />} />
              <Route path="withdraw" element={<MyPageWithdraw />} />
              <Route path="coupons" element={<MyPageCoupons />} />
              <Route path="points" element={<MyPagePoints />} />
              <Route path="refund-account" element={<MyPageAddresses />} />
              <Route path=":section" element={<MyPagePlaceholder />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <RequireAuth adminOnly>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="products" replace />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductNew />} />
              <Route path="products/:id/edit" element={<AdminProductNew />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="stats" element={<AdminStats />} />
              <Route path="sales" element={<AdminSales />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path=":section" element={<AdminPlaceholder />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  )
}

export default App
