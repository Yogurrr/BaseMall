import { api } from './axiosInstance';
import type { CartItem } from '../types/cart';

export const fetchCart = async (): Promise<CartItem[]> => {
  const response = await api.get<CartItem[]>('/cart');
  return response.data;
};

export const addCartItem = async (
  productId: number,
  quantity = 1,
  size?: string,
  markingName?: string,
): Promise<CartItem[]> => {
  const response = await api.post<CartItem[]>('/cart/items', { productId, quantity, size, markingName });
  return response.data;
};

export const updateCartItem = async (cartItemId: number, quantity: number): Promise<CartItem[]> => {
  const response = await api.put<CartItem[]>(`/cart/items/${cartItemId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (cartItemId: number): Promise<CartItem[]> => {
  const response = await api.delete<CartItem[]>(`/cart/items/${cartItemId}`);
  return response.data;
};

export const clearCartApi = async (): Promise<void> => {
  await api.delete('/cart');
};
