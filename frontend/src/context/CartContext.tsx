import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types/product';
import type { CartItem } from '../types/cart';
import { addCartItem, clearCartApi, fetchCart, removeCartItem, updateCartItem } from '../api/cartApi';
import { isLoggedIn, subscribeAuthChange } from '../api/authToken';

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  isLoading: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// 💡 비회원 장바구니는 이 브라우저에만 남는 임시 저장소. 로그인하면 계정 장바구니(백엔드)로 옮겨진다.
const GUEST_STORAGE_KEY = 'guest_cart_items';

const loadGuestItems = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const clampQuantity = (quantity: number) => Math.min(99, Math.max(1, quantity));

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [guestItems, setGuestItems] = useState<CartItem[]>(loadGuestItems);

  useEffect(() => subscribeAuthChange(() => setLoggedIn(isLoggedIn())), []);

  useEffect(() => {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestItems));
  }, [guestItems]);

  const { data: serverItems = [], isLoading: isServerLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: loggedIn,
  });

  // 💡 로그인하는 순간, 그때까지 쌓인 비회원 장바구니를 계정 장바구니로 합치고 비회원 저장소는 비운다.
  useEffect(() => {
    if (!loggedIn || guestItems.length === 0) return;

    const mergeGuestCart = async () => {
      for (const item of guestItems) {
        await addCartItem(item.id, item.quantity);
      }
      setGuestItems([]);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    };

    mergeGuestCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const items = loggedIn ? serverItems : guestItems;

  const addItem = (product: Product, quantity = 1) => {
    if (loggedIn) {
      addCartItem(product.id, quantity).then((updated) => queryClient.setQueryData(['cart'], updated));
      return;
    }
    setGuestItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: clampQuantity(item.quantity + quantity) } : item,
        );
      }
      return [...prev, { ...product, quantity: clampQuantity(quantity) }];
    });
  };

  const removeItem = (id: number) => {
    if (loggedIn) {
      removeCartItem(id).then((updated) => queryClient.setQueryData(['cart'], updated));
      return;
    }
    setGuestItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    const clamped = clampQuantity(quantity);
    if (loggedIn) {
      updateCartItem(id, clamped).then((updated) => queryClient.setQueryData(['cart'], updated));
      return;
    }
    setGuestItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: clamped } : item)));
  };

  const clearCart = () => {
    if (loggedIn) {
      clearCartApi().then(() => queryClient.setQueryData(['cart'], []));
      return;
    }
    setGuestItems([]);
  };

  const totalCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      totalCount,
      totalPrice,
      isLoading: loggedIn && isServerLoading,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, totalCount, totalPrice, loggedIn, isServerLoading],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
};
