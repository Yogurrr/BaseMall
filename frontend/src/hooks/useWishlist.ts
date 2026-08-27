import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Product } from '../types/product';
import {
  addWishlistItem,
  fetchWishlist,
  removeWishlistItem,
} from '../api/wishlistApi';
import { isLoggedIn, subscribeAuthChange } from '../api/authToken';
import { useGuestWishlistStore } from '../store/guestWishlistStore';

export const useWishlist = () => {
  const queryClient = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const guestItems = useGuestWishlistStore((state) => state.items);
  const guestToggle = useGuestWishlistStore((state) => state.toggle);
  const guestClear = useGuestWishlistStore((state) => state.clear);

  useEffect(() => subscribeAuthChange(() => setLoggedIn(isLoggedIn())), []);

  const { data: serverItems = [], isLoading: isServerLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
    enabled: loggedIn,
  });

  // 💡 로그인하는 순간, 그때까지 쌓인 비회원 위시리스트를 계정 위시리스트로 합치고 비회원 저장소는 비운다.
  useEffect(() => {
    if (!loggedIn || guestItems.length === 0) return;

    const mergeGuestWishlist = async () => {
      try {
        for (const item of guestItems) {
          await addWishlistItem(item.id);
        }
        guestClear();
        queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      } catch {
        toast.error('위시리스트를 합치는 중 오류가 발생했습니다.');
      }
    };

    mergeGuestWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const items = loggedIn ? serverItems : guestItems;

  const isLiked = useCallback(
    (id: number) => items.some((item) => item.id === id),
    [items],
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      if (loggedIn) {
        if (isLiked(product.id)) {
          removeWishlistItem(product.id)
            .then((updated) => queryClient.setQueryData(['wishlist'], updated))
            .catch(() =>
              toast.error('위시리스트에서 삭제하는 중 오류가 발생했습니다.'),
            );
        } else {
          addWishlistItem(product.id)
            .then((updated) => queryClient.setQueryData(['wishlist'], updated))
            .catch(() =>
              toast.error('위시리스트에 담는 중 오류가 발생했습니다.'),
            );
        }
        return;
      }
      guestToggle(product);
    },
    [loggedIn, isLiked, queryClient, guestToggle],
  );

  return {
    items,
    isLoading: loggedIn && isServerLoading,
    isLiked,
    toggleWishlist,
  };
};
