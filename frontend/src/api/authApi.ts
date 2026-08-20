import { api } from './axiosInstance';
import type { AuthResponse, RegisterRequest, UpdateProfileRequest, UserInfo } from '../types/user';

export const register = async (request: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', request);
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
};

export const fetchMe = async (): Promise<UserInfo> => {
  const response = await api.get<UserInfo>('/auth/me');
  return response.data;
};

export const deleteAccount = async (password: string): Promise<void> => {
  await api.delete('/auth/me', { data: { password } });
};

export const updateFavoriteTeam = async (team: string | null): Promise<UserInfo> => {
  const response = await api.patch<UserInfo>('/auth/me/favorite-team', { team });
  return response.data;
};

export const updateProfile = async (request: UpdateProfileRequest): Promise<UserInfo> => {
  const response = await api.patch<UserInfo>('/auth/me', request);
  return response.data;
};
