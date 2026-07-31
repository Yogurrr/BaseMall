import { api } from './axiosInstance';
import type { Product } from './productApi';

export interface CartItemDto extends Product {
  quantity: number;
}

export const fetchCart = async (): Promise<CartItemDto[]> => {
  const response = await api.get<CartItemDto[]>('/cart');
  return response.data;
};

export const addCartItem = async (productId: number, quantity = 1): Promise<CartItemDto[]> => {
  const response = await api.post<CartItemDto[]>('/cart/items', { productId, quantity });
  return response.data;
};

export const updateCartItem = async (productId: number, quantity: number): Promise<CartItemDto[]> => {
  const response = await api.put<CartItemDto[]>(`/cart/items/${productId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (productId: number): Promise<CartItemDto[]> => {
  const response = await api.delete<CartItemDto[]>(`/cart/items/${productId}`);
  return response.data;
};

export const clearCartApi = async (): Promise<void> => {
  await api.delete('/cart');
};
