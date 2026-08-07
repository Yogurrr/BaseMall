import { api } from './axiosInstance';
import type { MemberStats, User, UserDetail } from '../types/user';

export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

export const fetchUserById = async (id: number): Promise<UserDetail> => {
  const response = await api.get<UserDetail>(`/users/${id}`);
  return response.data;
};

export const fetchMemberStats = async (): Promise<MemberStats> => {
  const response = await api.get<MemberStats>('/users/stats');
  return response.data;
};