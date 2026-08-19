import { api } from './axiosInstance';
import type { Coupon } from '../types/coupon';

export const fetchMyCoupons = async (): Promise<Coupon[]> => {
  const response = await api.get<Coupon[]>('/coupons/me');
  return response.data;
};

export const issueCouponsByGrade = async (grade: string): Promise<{ issuedCount: number }> => {
  const response = await api.post<{ issuedCount: number }>('/coupons', { grade });
  return response.data;
};
