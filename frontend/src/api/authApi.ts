import { api } from './axiosInstance';

export interface AuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  favoriteTeam?: string;
}

export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
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
