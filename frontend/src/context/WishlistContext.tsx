import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types/product';
import type { WishlistItem } from '../types/wishlist';
import { addWishlistItem, fetchWishlist, removeWishlistItem } from '../api/wishlistApi';
import { isLoggedIn, subscribeAuthChange } from '../api/authToken';

interface WishlistContextValue {
  items: WishlistItem[];
  isLoading: boolean;
  isLiked: (id: number) => boolean;
  toggleWishlist: (product: Product) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

// 💡 비회원 위시리스트는 이 브라우저에만 남는 임시 저장소. 로그인하면 계정 위시리스트(백엔드)로 옮겨진다.
const GUEST_STORAGE_KEY = 'guest_wishlist_items';

const loadGuestItems = (): WishlistItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
  } catch {
    return [];
  }
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [guestItems, setGuestItems] = useState<WishlistItem[]>(loadGuestItems);

  useEffect(() => subscribeAuthChange(() => setLoggedIn(isLoggedIn())), []);

  useEffect(() => {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestItems));
  }, [guestItems]);

  const { data: serverItems = [], isLoading: isServerLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
    enabled: loggedIn,
  });

  // 💡 로그인하는 순간, 그때까지 쌓인 비회원 위시리스트를 계정 위시리스트로 합치고 비회원 저장소는 비운다.
  useEffect(() => {
    if (!loggedIn || guestItems.length === 0) return;

    const mergeGuestWishlist = async () => {
      for (const item of guestItems) {
        await addWishlistItem(item.id);
      }
      setGuestItems([]);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    };

    mergeGuestWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const items = loggedIn ? serverItems : guestItems;

  const isLiked = (id: number) => items.some((item) => item.id === id);

  const toggleWishlist = (product: Product) => {
    if (loggedIn) {
      if (isLiked(product.id)) {
        removeWishlistItem(product.id).then((updated) => queryClient.setQueryData(['wishlist'], updated));
      } else {
        addWishlistItem(product.id).then((updated) => queryClient.setQueryData(['wishlist'], updated));
      }
      return;
    }
    setGuestItems((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product],
    );
  };

  const value = useMemo(
    () => ({
      items,
      isLoading: loggedIn && isServerLoading,
      isLiked,
      toggleWishlist,
    }),
    [items, loggedIn, isServerLoading],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
};
