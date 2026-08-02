import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Search } from './pages/Search';
import { Cart } from './pages/Cart';
import { MyPageLayout } from './pages/mypage/MyPageLayout';
import { MyPageHome } from './pages/mypage/MyPageHome';
import { MyPageOrders } from './pages/mypage/MyPageOrders';
import { MyPageWishlist } from './pages/mypage/MyPageWishlist';
import { MyPageWithdraw } from './pages/mypage/MyPageWithdraw';
import { MyPagePlaceholder } from './pages/mypage/MyPagePlaceholder';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';
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
              <Route path="wishlist" element={<MyPageWishlist />} />
              <Route path="withdraw" element={<MyPageWithdraw />} />
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
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path=":section" element={<AdminPlaceholder />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  )
}

export default App
