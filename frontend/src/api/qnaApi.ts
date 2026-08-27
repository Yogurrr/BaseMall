import { api } from './axiosInstance';
import type { AdminQna, MyQna, Qna } from '../types/qna';

export const fetchQnas = async (productId: number): Promise<Qna[]> => {
  const response = await api.get<Qna[]>(`/products/${productId}/qna`);
  return response.data;
};

export const createQna = async (
  productId: number,
  question: string,
): Promise<Qna> => {
  const response = await api.post<Qna>(`/products/${productId}/qna`, {
    question,
  });
  return response.data;
};

export const deleteQna = async (
  productId: number,
  qnaId: number,
): Promise<void> => {
  await api.delete(`/products/${productId}/qna/${qnaId}`);
};

export const fetchMyQnas = async (): Promise<MyQna[]> => {
  const response = await api.get<MyQna[]>('/qna/me');
  return response.data;
};

export const fetchAllQnas = async (): Promise<AdminQna[]> => {
  const response = await api.get<AdminQna[]>('/qna');
  return response.data;
};

export const answerQna = async (
  id: number,
  answer: string,
): Promise<AdminQna> => {
  const response = await api.patch<AdminQna>(`/qna/${id}/answer`, { answer });
  return response.data;
};
