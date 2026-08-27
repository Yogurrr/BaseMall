import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { refreshAccessToken } from './api/axiosInstance';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Search } from './pages/Search';
import { Cart } from './pages/Cart';
import { Login } from './pages/Login';
import { RequireAuth } from './components/RequireAuth';
import { Spinner } from './components/Spinner/Spinner';

// 💡 결제/마이페이지/관리자 페이지는 일반 방문 흐름(홈→검색→상품→장바구니)에서는 안 쓰이는
// 갈래라 초기 번들에서 빼서 지연 로딩한다. 로그인/장바구니 등 핵심 경로는 그대로 정적 import 유지.
const Checkout = lazy(() =>
  import('./pages/Checkout').then((m) => ({ default: m.Checkout })),
);
const KakaoPayApprove = lazy(() =>
  import('./pages/KakaoPayApprove').then((m) => ({
    default: m.KakaoPayApprove,
  })),
);
const KakaoPayNotice = lazy(() =>
  import('./pages/KakaoPayNotice').then((m) => ({
    default: m.KakaoPayNotice,
  })),
);
const TossPayApprove = lazy(() =>
  import('./pages/TossPayApprove').then((m) => ({
    default: m.TossPayApprove,
  })),
);
const TossPayNotice = lazy(() =>
  import('./pages/TossPayNotice').then((m) => ({ default: m.TossPayNotice })),
);
const MyPageLayout = lazy(() =>
  import('./pages/mypage/MyPageLayout').then((m) => ({
    default: m.MyPageLayout,
  })),
);
const MyPageHome = lazy(() =>
  import('./pages/mypage/MyPageHome').then((m) => ({
    default: m.MyPageHome,
  })),
);
const MyPageOrders = lazy(() =>
  import('./pages/mypage/MyPageOrders').then((m) => ({
    default: m.MyPageOrders,
  })),
);
const MyPageReturns = lazy(() =>
  import('./pages/mypage/MyPageReturns').then((m) => ({
    default: m.MyPageReturns,
  })),
);
const MyPageWishlist = lazy(() =>
  import('./pages/mypage/MyPageWishlist').then((m) => ({
    default: m.MyPageWishlist,
  })),
);
const MyPageRecentViews = lazy(() =>
  import('./pages/mypage/MyPageRecentViews').then((m) => ({
    default: m.MyPageRecentViews,
  })),
);
const MyPageReviews = lazy(() =>
  import('./pages/mypage/MyPageReviews').then((m) => ({
    default: m.MyPageReviews,
  })),
);
const MyPageWithdraw = lazy(() =>
  import('./pages/mypage/MyPageWithdraw').then((m) => ({
    default: m.MyPageWithdraw,
  })),
);
const MyPageCoupons = lazy(() =>
  import('./pages/mypage/MyPageCoupons').then((m) => ({
    default: m.MyPageCoupons,
  })),
);
const MyPagePoints = lazy(() =>
  import('./pages/mypage/MyPagePoints').then((m) => ({
    default: m.MyPagePoints,
  })),
);
const MyPageAddresses = lazy(() =>
  import('./pages/mypage/MyPageAddresses').then((m) => ({
    default: m.MyPageAddresses,
  })),
);
const MyPageProfileEdit = lazy(() =>
  import('./pages/mypage/MyPageProfileEdit').then((m) => ({
    default: m.MyPageProfileEdit,
  })),
);
const MyPageKakaoCallback = lazy(() =>
  import('./pages/MyPageKakaoCallback').then((m) => ({
    default: m.MyPageKakaoCallback,
  })),
);
const LoginKakaoCallback = lazy(() =>
  import('./pages/LoginKakaoCallback').then((m) => ({
    default: m.LoginKakaoCallback,
  })),
);
const MyPageInquiries = lazy(() =>
  import('./pages/mypage/MyPageInquiries').then((m) => ({
    default: m.MyPageInquiries,
  })),
);
const MyPageQna = lazy(() =>
  import('./pages/mypage/MyPageQna').then((m) => ({ default: m.MyPageQna })),
);
const MyPagePlaceholder = lazy(() =>
  import('./pages/mypage/MyPagePlaceholder').then((m) => ({
    default: m.MyPagePlaceholder,
  })),
);
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({
    default: m.AdminLayout,
  })),
);
const AdminProducts = lazy(() =>
  import('./pages/admin/AdminProducts').then((m) => ({
    default: m.AdminProducts,
  })),
);
const AdminProductNew = lazy(() =>
  import('./pages/admin/AdminProductNew').then((m) => ({
    default: m.AdminProductNew,
  })),
);
const AdminOrders = lazy(() =>
  import('./pages/admin/AdminOrders').then((m) => ({
    default: m.AdminOrders,
  })),
);
const AdminUsers = lazy(() =>
  import('./pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })),
);
const AdminStats = lazy(() =>
  import('./pages/admin/AdminStats').then((m) => ({ default: m.AdminStats })),
);
const AdminSales = lazy(() =>
  import('./pages/admin/AdminSales').then((m) => ({ default: m.AdminSales })),
);
const AdminCoupons = lazy(() =>
  import('./pages/admin/AdminCoupons').then((m) => ({
    default: m.AdminCoupons,
  })),
);
const AdminBanners = lazy(() =>
  import('./pages/admin/AdminBanners').then((m) => ({
    default: m.AdminBanners,
  })),
);
const AdminCategories = lazy(() =>
  import('./pages/admin/AdminCategories').then((m) => ({
    default: m.AdminCategories,
  })),
);
const AdminInquiries = lazy(() =>
  import('./pages/admin/AdminInquiries').then((m) => ({
    default: m.AdminInquiries,
  })),
);
const AdminQna = lazy(() =>
  import('./pages/admin/AdminQna').then((m) => ({ default: m.AdminQna })),
);
const AdminPlaceholder = lazy(() =>
  import('./pages/admin/AdminPlaceholder').then((m) => ({
    default: m.AdminPlaceholder,
  })),
);

const RouteFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
    }}
  >
    <Spinner size={48} />
  </div>
);

function App() {
  // 💡 공개 페이지(홈 등)에서도 헤더의 로그인 상태가 새로고침 후 조용히 복구되도록 앱 시작 시
  // 한 번 시도한다. 실패해도(대부분의 익명 방문) 조용히 무시되므로 공개 페이지엔 지장 없다.
  // RequireAuth가 같은 함수를 호출해도 refreshAccessToken이 진행 중인 프라미스를 공유해 중복 호출은 안 난다.
  useEffect(() => {
    refreshAccessToken().catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/kakao/approve" element={<KakaoPayApprove />} />
          <Route
            path="/checkout/kakao/cancel"
            element={<KakaoPayNotice status="cancel" />}
          />
          <Route
            path="/checkout/kakao/fail"
            element={<KakaoPayNotice status="fail" />}
          />
          <Route path="/checkout/toss/approve" element={<TossPayApprove />} />
          <Route path="/checkout/toss/fail" element={<TossPayNotice />} />
          <Route
            path="/mypage/kakao/callback"
            element={<MyPageKakaoCallback />}
          />
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
            <Route path="recent" element={<MyPageRecentViews />} />
            <Route path="wishlist" element={<MyPageWishlist />} />
            <Route path="reviews" element={<MyPageReviews />} />
            <Route path="withdraw" element={<MyPageWithdraw />} />
            <Route path="coupons" element={<MyPageCoupons />} />
            <Route path="points" element={<MyPagePoints />} />
            <Route path="refund-account" element={<MyPageAddresses />} />
            <Route path="profile-edit" element={<MyPageProfileEdit />} />
            <Route path="inquiries" element={<MyPageInquiries />} />
            <Route path="qna" element={<MyPageQna />} />
            <Route path=":section" element={<MyPagePlaceholder />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route
            path="/login/kakao/callback"
            element={<LoginKakaoCallback />}
          />
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
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="qna" element={<AdminQna />} />
            <Route path=":section" element={<AdminPlaceholder />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
