import { api } from './axiosInstance';
import type { Order } from '../types/order';

export const ORDER_STATUSES = ['결제완료', '배송준비중', '배송중', '배송완료', '주문취소'] as const;

export const createOrder = async (address: string): Promise<Order> => {
  const response = await api.post<Order>('/orders', { address });
  return response.data;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/orders');
  return response.data;
};

export const fetchMyOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/orders/me');
  return response.data;
};

export const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${id}/status`, { status });
  return response.data;
};

export const updateTrackingNumber = async (id: number, trackingNumber: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${id}/tracking`, { trackingNumber });
  return response.data;
};
