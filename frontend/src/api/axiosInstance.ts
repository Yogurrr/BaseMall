import axios, { type InternalAxiosRequestConfig } from 'axios';
import { clearToken, getToken, setToken } from './authToken';
import type { AuthResponse } from '../types/user';
import { DEFAULT_REQUEST_TIMEOUT_MS } from '../constants/http';

// 💡 백엔드(Spring Boot) 주소는 배포 환경마다 달라지므로 하드코딩하지 않고 VITE_API_BASE_URL로 주입한다.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  // 💡 리프레시 토큰이 httpOnly 쿠키(Path=/api/auth)로 오가므로 요청마다 실어 보내야 한다.
  // 쿠키가 그 경로로 스코프돼 있어 다른 요청엔 어차피 안 실리니 전역으로 켜도 무해하다.
  withCredentials: true,
});

// 💡 로그인 토큰이 있으면 모든 요청에 자동으로 실어 보낸다.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// 💡 동시에 여러 요청이 401을 받아도 /auth/refresh 네트워크 호출은 한 번만 나가도록 진행 중인
// 프라미스를 공유한다. App.tsx(부트스트랩)와 RequireAuth.tsx(라우트 가드)도 이 함수를 그대로 재사용한다.
let refreshPromise: Promise<void> | null = null;

export const refreshAccessToken = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = api
      .post<AuthResponse>('/auth/refresh')
      .then(({ data }) => setToken(data.token))
      .catch((error) => {
        clearToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// 💡 액세스 토큰이 만료돼 401이 오면 리프레시를 한 번 시도하고, 성공하면 원 요청을 새 토큰으로
// 재시도한다. _retry로 무한루프를, /auth/refresh 자체의 401 제외로 재귀 호출을 막는다.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableRequestConfig | undefined;
    const isRefreshCall = original?.url?.includes('/auth/refresh');

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isRefreshCall
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      await refreshAccessToken();
      return api(original);
    } catch {
      return Promise.reject(error);
    }
  },
);
