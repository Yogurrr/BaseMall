import { api } from './axiosInstance';
import type {
  AuthResponse,
  RegisterRequest,
  UpdateProfileRequest,
  UserInfo,
} from '../types/user';

export const register = async (
  request: RegisterRequest,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', request);
  return response.data;
};

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return response.data;
};

export const loginWithKakao = async (code: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/kakao/login', { code });
  return response.data;
};

export const fetchMe = async (): Promise<UserInfo> => {
  const response = await api.get<UserInfo>('/auth/me');
  return response.data;
};

// 💡 서버쪽 리프레시 토큰도 폐기해야 새로고침 시 조용히 재로그인되는 걸 막을 수 있다.
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const deleteAccount = async (password: string): Promise<void> => {
  await api.delete('/auth/me', { data: { password } });
};

export const updateFavoriteTeam = async (
  team: string | null,
): Promise<UserInfo> => {
  const response = await api.patch<UserInfo>('/auth/me/favorite-team', {
    team,
  });
  return response.data;
};

export const updateProfile = async (
  request: UpdateProfileRequest,
): Promise<UserInfo> => {
  const response = await api.patch<UserInfo>('/auth/me', request);
  return response.data;
};

export const linkKakaoAccount = async (code: string): Promise<UserInfo> => {
  const response = await api.post<UserInfo>('/auth/kakao/link', { code });
  return response.data;
};

export const unlinkKakaoAccount = async (): Promise<UserInfo> => {
  const response = await api.delete<UserInfo>('/auth/kakao/link');
  return response.data;
};
