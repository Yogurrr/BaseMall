import { api } from './axiosInstance';
import type { PointTransaction } from '../types/point';

export const fetchMyPointTransactions = async (): Promise<
  PointTransaction[]
> => {
  const response = await api.get<PointTransaction[]>('/points/me');
  return response.data;
};
