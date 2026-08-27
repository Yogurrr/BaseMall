import { api } from './axiosInstance';
import type { Banner, BannerInput } from '../types/banner';

export const fetchActiveBanners = async (): Promise<Banner[]> => {
  const response = await api.get<Banner[]>('/banners');
  return response.data;
};

export const fetchAllBanners = async (): Promise<Banner[]> => {
  const response = await api.get<Banner[]>('/banners/admin');
  return response.data;
};

export const createBanner = async (payload: BannerInput): Promise<Banner> => {
  const response = await api.post<Banner>('/banners', payload);
  return response.data;
};

export const updateBanner = async (
  id: number,
  payload: BannerInput,
): Promise<Banner> => {
  const response = await api.put<Banner>(`/banners/${id}`, payload);
  return response.data;
};

export const updateBannerActive = async (
  id: number,
  active: boolean,
): Promise<Banner> => {
  const response = await api.patch<Banner>(`/banners/${id}/active`, { active });
  return response.data;
};

export const deleteBanner = async (id: number): Promise<void> => {
  await api.delete(`/banners/${id}`);
};

export const uploadBannerImage = async (
  file: File,
): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  // 💡 axiosInstance가 기본 Content-Type을 application/json으로 고정해두므로,
  // multipart 경계(boundary)를 브라우저가 직접 채우도록 여기서만 헤더를 비워준다.
  const response = await api.post<{ imageUrl: string }>(
    '/banners/images',
    formData,
    {
      headers: { 'Content-Type': undefined },
    },
  );
  return response.data;
};
