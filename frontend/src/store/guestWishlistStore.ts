import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types/product';
import type { WishlistItem } from '../types/wishlist';

interface GuestWishlistState {
  items: WishlistItem[];
  toggle: (product: Product) => void;
  clear: () => void;
}

// 💡 비회원 위시리스트는 이 브라우저에만 남는 임시 저장소(persist 미들웨어가 localStorage와 동기화).
// 로그인하면 계정 위시리스트(백엔드)로 옮겨진다 — 병합은 useWishlist에서 처리.
export const useGuestWishlistStore = create<GuestWishlistState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (product) =>
        set((state) => ({
          items: state.items.some((item) => item.id === product.id)
            ? state.items.filter((item) => item.id !== product.id)
            : [...state.items, product],
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'guest_wishlist_items' },
  ),
);
