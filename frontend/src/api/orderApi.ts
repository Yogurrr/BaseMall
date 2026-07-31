import { api } from './axiosInstance';

export interface OrderItem {
  name: string;
  category?: string;
  emoji: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  buyerName: string;
  buyerEmail: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  items: OrderItem[];
}

export const ORDER_STATUSES = ['결제완료', '배송준비중', '배송중', '배송완료', '주문취소'] as const;

export const createOrder = async (): Promise<Order> => {
  const response = await api.post<Order>('/orders');
  return response.data;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/orders');
  return response.data;
};

export const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
  const response = await api.patch<Order>(`/orders/${id}/status`, { status });
  return response.data;
};
