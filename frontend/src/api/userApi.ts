import { api } from './axiosInstance';
import type { User } from '../types/user';

export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};