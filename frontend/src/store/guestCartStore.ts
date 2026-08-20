import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types/cart';
import type { Product } from '../types/product';

interface GuestCartOptions {
  size?: string;
  markingName?: string;
}

interface GuestCartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number, options?: GuestCartOptions) => void;
  removeItem: (cartItemId: number) => void;
  updateQuantity: (cartItemId: number, quantity: number) => void;
  clear: () => void;
}

export const clampQuantity = (quantity: number) => Math.min(99, Math.max(1, quantity));

// 💡 비회원 장바구니 줄은 서버 DB가 없어 클라이언트에서 임시 식별자를 만든다.
const generateGuestCartItemId = () => Date.now() + Math.random();

// 💡 비회원 장바구니는 이 브라우저에만 남는 임시 저장소(persist 미들웨어가 localStorage와 동기화).
// 로그인하면 계정 장바구니(백엔드)로 옮겨진다 — 병합은 useCart에서 처리.
export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity, options) =>
        set((state) => {
          const size = options?.size;
          const markingName = options?.markingName;
          const existing = state.items.find(
            (item) => item.id === product.id && item.size === size && item.markingName === markingName,
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.cartItemId === existing.cartItemId
                  ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
                  : item,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...product,
                cartItemId: generateGuestCartItemId(),
                quantity: clampQuantity(quantity),
                size,
                markingName,
              },
            ],
          };
        }),
      removeItem: (cartItemId) =>
        set((state) => ({ items: state.items.filter((item) => item.cartItemId !== cartItemId) })),
      updateQuantity: (cartItemId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity: clampQuantity(quantity) } : item,
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'guest_cart_items' },
  ),
);
