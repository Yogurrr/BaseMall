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

export interface User {
  id?: number;
  name: string;
  email: string;
}
