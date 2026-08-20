import { api } from './axiosInstance';
import type { RecentViewItem } from '../types/recentView';

export const fetchRecentViews = async (): Promise<RecentViewItem[]> => {
  const response = await api.get<RecentViewItem[]>('/recent-views');
  return response.data;
};

export const recordRecentView = async (productId: number): Promise<void> => {
  await api.post(`/recent-views/${productId}`);
};
