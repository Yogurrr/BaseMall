import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types/product';
import { addCartItem, clearCartApi, fetchCart, removeCartItem, updateCartItem } from '../api/cartApi';
import { isLoggedIn, subscribeAuthChange } from '../api/authToken';
import { clampQuantity, useGuestCartStore } from '../store/guestCartStore';

interface CartItemOptions {
  size?: string;
  markingName?: string;
}

export const useCart = () => {
  const queryClient = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const guestItems = useGuestCartStore((state) => state.items);
  const guestAddItem = useGuestCartStore((state) => state.addItem);
  const guestRemoveItem = useGuestCartStore((state) => state.removeItem);
  const guestUpdateQuantity = useGuestCartStore((state) => state.updateQuantity);
  const guestClear = useGuestCartStore((state) => state.clear);

  useEffect(() => subscribeAuthChange(() => setLoggedIn(isLoggedIn())), []);

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
      guestClear();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    };

    mergeGuestCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const items = loggedIn ? serverItems : guestItems;

  const addItem = useCallback(
    (product: Product, quantity = 1, options?: CartItemOptions) => {
      if (loggedIn) {
        addCartItem(product.id, quantity, options?.size, options?.markingName).then((updated) =>
          queryClient.setQueryData(['cart'], updated),
        );
        return;
      }
      guestAddItem(product, quantity, options);
    },
    [loggedIn, queryClient, guestAddItem],
  );

  const removeItem = useCallback(
    (cartItemId: number) => {
      if (loggedIn) {
        removeCartItem(cartItemId).then((updated) => queryClient.setQueryData(['cart'], updated));
        return;
      }
      guestRemoveItem(cartItemId);
    },
    [loggedIn, queryClient, guestRemoveItem],
  );

  const updateQuantity = useCallback(
    (cartItemId: number, quantity: number) => {
      const clamped = clampQuantity(quantity);
      if (loggedIn) {
        updateCartItem(cartItemId, clamped).then((updated) => queryClient.setQueryData(['cart'], updated));
        return;
      }
      guestUpdateQuantity(cartItemId, clamped);
    },
    [loggedIn, queryClient, guestUpdateQuantity],
  );

  const clearCart = useCallback(() => {
    if (loggedIn) {
      clearCartApi().then(() => queryClient.setQueryData(['cart'], []));
      return;
    }
    guestClear();
  }, [loggedIn, queryClient, guestClear]);

  const totalCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return {
    items,
    totalCount,
    totalPrice,
    isLoading: loggedIn && isServerLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
};
