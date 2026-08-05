import { api } from './axiosInstance';
import type { Review } from '../types/review';

export const fetchReviews = async (productId: number): Promise<Review[]> => {
  const response = await api.get<Review[]>(`/products/${productId}/reviews`);
  return response.data;
};

export const createReview = async (productId: number, rating: number, content: string): Promise<Review> => {
  const response = await api.post<Review>(`/products/${productId}/reviews`, { rating, content });
  return response.data;
};

export const updateReview = async (
  productId: number,
  reviewId: number,
  rating: number,
  content: string,
): Promise<Review> => {
  const response = await api.put<Review>(`/products/${productId}/reviews/${reviewId}`, { rating, content });
  return response.data;
};

export const deleteReview = async (productId: number, reviewId: number): Promise<void> => {
  await api.delete(`/products/${productId}/reviews/${reviewId}`);
};
