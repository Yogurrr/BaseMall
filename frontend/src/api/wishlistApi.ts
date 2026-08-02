import { api } from './axiosInstance';
import type { WishlistItem } from '../types/wishlist';

export const fetchWishlist = async (): Promise<WishlistItem[]> => {
  const response = await api.get<WishlistItem[]>('/wishlist');
  return response.data;
};

export const addWishlistItem = async (productId: number): Promise<WishlistItem[]> => {
  const response = await api.post<WishlistItem[]>('/wishlist/items', { productId });
  return response.data;
};

export const removeWishlistItem = async (productId: number): Promise<WishlistItem[]> => {
  const response = await api.delete<WishlistItem[]>(`/wishlist/items/${productId}`);
  return response.data;
};
