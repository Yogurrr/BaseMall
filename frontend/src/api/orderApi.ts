import { api } from './axiosInstance';
import type { Order, OrderCountStats, SalesBreakdown, SalesSummary } from '../types/order';

export const ORDER_STATUSES = ['결제완료', '배송준비중', '배송중', '배송완료', '주문취소'] as const;

export const PAYMENT_METHODS = ['카카오페이', '토스페이먼츠'] as const;

export const ENTRY_METHODS = ['비밀번호', '경비실호출', '자유출입가능', '기타사항'] as const;

export interface CreateOrderParams {
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address: string;
  addressDetail?: string;
  paymentMethod: string;
  couponId?: number;
  deliveryRequest?: string;
  entryMethod?: string;
  entryNote?: string;
  pointsUsed?: number;
}

export const createOrder = async (params: CreateOrderParams): Promise<Order> => {
  const response = await api.post<Order>('/orders', params);
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

export const fetchOrdersByUserId = async (userId: number): Promise<Order[]> => {
  const response = await api.get<Order[]>(`/orders/user/${userId}`);
  return response.data;
};

export const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${id}/status`, { status });
  return response.data;
};

export const cancelOrder = async (id: number): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${id}/cancel`);
  return response.data;
};

export const updateTrackingNumber = async (id: number, trackingNumber: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${id}/tracking`, { trackingNumber });
  return response.data;
};

export const fetchSales = async (): Promise<SalesSummary> => {
  const response = await api.get<SalesSummary>('/orders/sales');
  return response.data;
};

export const fetchSalesBreakdown = async (from: string, to: string): Promise<SalesBreakdown> => {
  const response = await api.get<SalesBreakdown>('/orders/sales/breakdown', { params: { from, to } });
  return response.data;
};

export const fetchOrderCountStats = async (): Promise<OrderCountStats> => {
  const response = await api.get<OrderCountStats>('/orders/count-stats');
  return response.data;
};
