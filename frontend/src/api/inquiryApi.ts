import { api } from './axiosInstance';
import type { AdminInquiry, Inquiry } from '../types/inquiry';

export interface CreateInquiryParams {
  category: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  orderId?: number | null;
}

export const fetchMyInquiries = async (): Promise<Inquiry[]> => {
  const response = await api.get<Inquiry[]>('/inquiries/me');
  return response.data;
};

export const fetchInquiry = async (id: number): Promise<Inquiry> => {
  const response = await api.get<Inquiry>(`/inquiries/${id}`);
  return response.data;
};

export const createInquiry = async (
  params: CreateInquiryParams,
): Promise<Inquiry> => {
  const response = await api.post<Inquiry>('/inquiries', params);
  return response.data;
};

export const deleteInquiry = async (id: number): Promise<void> => {
  await api.delete(`/inquiries/${id}`);
};

export const uploadInquiryImage = async (
  file: File,
): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ imageUrl: string }>(
    '/inquiries/images',
    formData,
    {
      headers: { 'Content-Type': undefined },
    },
  );
  return response.data;
};

export const fetchAllInquiries = async (): Promise<AdminInquiry[]> => {
  const response = await api.get<AdminInquiry[]>('/inquiries');
  return response.data;
};

export const answerInquiry = async (
  id: number,
  answer: string,
): Promise<AdminInquiry> => {
  const response = await api.patch<AdminInquiry>(`/inquiries/${id}/answer`, {
    answer,
  });
  return response.data;
};
