import { api } from './axiosInstance';
import type { CreateOrderParams } from './orderApi';
import type { Order } from '../types/order';

interface KakaoReadyResponse {
  redirectUrl: string;
}

export const readyKakaoPayment = async (params: CreateOrderParams): Promise<KakaoReadyResponse> => {
  const response = await api.post<KakaoReadyResponse>('/payments/kakao/ready', params);
  return response.data;
};

export const approveKakaoPayment = async (orderId: string, pgToken: string): Promise<Order> => {
  const response = await api.post<Order>('/payments/kakao/approve', { orderId, pgToken });
  return response.data;
};

interface TossReadyResponse {
  orderId: string;
  amount: number;
  orderName: string;
}

export const prepareTossPayment = async (params: CreateOrderParams): Promise<TossReadyResponse> => {
  const response = await api.post<TossReadyResponse>('/payments/toss/prepare', params);
  return response.data;
};

export const confirmTossPayment = async (paymentKey: string, orderId: string, amount: number): Promise<Order> => {
  const response = await api.post<Order>('/payments/toss/confirm', { paymentKey, orderId, amount });
  return response.data;
};
