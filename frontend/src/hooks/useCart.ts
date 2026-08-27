import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Product } from '../types/product';
import {
  addCartItem,
  clearCartApi,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '../api/cartApi';
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
  const guestUpdateQuantity = useGuestCartStore(
    (state) => state.updateQuantity,
  );
  const guestClear = useGuestCartStore((state) => state.clear);
  const isMergingGuestCartRef = useRef(false);

  useEffect(() => subscribeAuthChange(() => setLoggedIn(isLoggedIn())), []);

  const { data: serverItems = [], isLoading: isServerLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: loggedIn,
  });

  // 💡 로그인하는 순간, 그때까지 쌓인 비회원 장바구니를 계정 장바구니로 합친다.
  // 서버 addItem은 같은 상품+옵션이면 수량을 누적하는 방식이라, 병합 중 일부가 실패해서
  // 재시도되면 이미 합쳐진 아이템까지 다시 더해져 수량이 중복 누적될 수 있다.
  // 그래서 성공한 아이템은 즉시 게스트 저장소에서 제거해 재시도 시 남은 아이템만 다시 시도하게 하고,
  // ref로 동시 실행(StrictMode 이중 마운트 등)도 막는다.
  useEffect(() => {
    if (!loggedIn || guestItems.length === 0 || isMergingGuestCartRef.current) {
      return;
    }

    const mergeGuestCart = async () => {
      isMergingGuestCartRef.current = true;
      const itemsToMerge = useGuestCartStore.getState().items;
      let hasFailure = false;

      for (const item of itemsToMerge) {
        try {
          await addCartItem(
            item.id,
            item.quantity,
            item.size,
            item.markingName,
          );
          guestRemoveItem(item.cartItemId);
        } catch {
          hasFailure = true;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['cart'] });
      if (hasFailure) {
        toast.error(
          '일부 상품을 장바구니에 합치지 못했습니다. 다시 시도해주세요.',
        );
      }
      isMergingGuestCartRef.current = false;
    };

    mergeGuestCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const items = loggedIn ? serverItems : guestItems;

  const addItem = useCallback(
    (product: Product, quantity = 1, options?: CartItemOptions) => {
      if (loggedIn) {
        addCartItem(product.id, quantity, options?.size, options?.markingName)
          .then((updated) => queryClient.setQueryData(['cart'], updated))
          .catch(() => toast.error('장바구니에 담는 중 오류가 발생했습니다.'));
        return;
      }
      guestAddItem(product, quantity, options);
    },
    [loggedIn, queryClient, guestAddItem],
  );

  const removeItem = useCallback(
    (cartItemId: number) => {
      if (loggedIn) {
        removeCartItem(cartItemId)
          .then((updated) => queryClient.setQueryData(['cart'], updated))
          .catch(() =>
            toast.error('장바구니에서 상품을 삭제하는 중 오류가 발생했습니다.'),
          );
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
        updateCartItem(cartItemId, clamped)
          .then((updated) => queryClient.setQueryData(['cart'], updated))
          .catch(() => toast.error('수량을 변경하는 중 오류가 발생했습니다.'));
        return;
      }
      guestUpdateQuantity(cartItemId, clamped);
    },
    [loggedIn, queryClient, guestUpdateQuantity],
  );

  const clearCart = useCallback(() => {
    if (loggedIn) {
      clearCartApi()
        .then(() => queryClient.setQueryData(['cart'], []))
        .catch(() => toast.error('장바구니를 비우는 중 오류가 발생했습니다.'));
      return;
    }
    guestClear();
  }, [loggedIn, queryClient, guestClear]);

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

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
