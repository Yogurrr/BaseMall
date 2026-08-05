import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types/product';
import type { CartItem } from '../types/cart';
import { addCartItem, clearCartApi, fetchCart, removeCartItem, updateCartItem } from '../api/cartApi';
import { isLoggedIn, subscribeAuthChange } from '../api/authToken';

interface CartItemOptions {
  size?: string;
  markingName?: string;
}

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  isLoading: boolean;
  addItem: (product: Product, quantity?: number, options?: CartItemOptions) => void;
  removeItem: (cartItemId: number) => void;
  updateQuantity: (cartItemId: number, quantity: number) => void;
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

// 💡 비회원 장바구니 줄은 서버 DB가 없어 클라이언트에서 임시 식별자를 만든다.
const generateGuestCartItemId = () => Date.now() + Math.random();

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
        await addCartItem(item.id, item.quantity, item.size, item.markingName);
      }
      setGuestItems([]);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    };

    mergeGuestCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const items = loggedIn ? serverItems : guestItems;

  const addItem = (product: Product, quantity = 1, options?: CartItemOptions) => {
    const size = options?.size;
    const markingName = options?.markingName;

    if (loggedIn) {
      addCartItem(product.id, quantity, size, markingName).then((updated) =>
        queryClient.setQueryData(['cart'], updated),
      );
      return;
    }
    setGuestItems((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.size === size && item.markingName === markingName,
      );
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === existing.cartItemId
            ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
            : item,
        );
      }
      return [
        ...prev,
        { ...product, cartItemId: generateGuestCartItemId(), quantity: clampQuantity(quantity), size, markingName },
      ];
    });
  };

  const removeItem = (cartItemId: number) => {
    if (loggedIn) {
      removeCartItem(cartItemId).then((updated) => queryClient.setQueryData(['cart'], updated));
      return;
    }
    setGuestItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: number, quantity: number) => {
    const clamped = clampQuantity(quantity);
    if (loggedIn) {
      updateCartItem(cartItemId, clamped).then((updated) => queryClient.setQueryData(['cart'], updated));
      return;
    }
    setGuestItems((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: clamped } : item)),
    );
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
