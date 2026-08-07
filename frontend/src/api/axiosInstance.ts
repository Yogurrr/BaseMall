import axios from 'axios';
import { clearToken, getToken } from './authToken';

// 💡 백엔드(Spring Boot) 기본 주소 설정
export const api = axios.create({
  baseURL: 'http://localhost:8080/api', // 기본 백엔드 API URL
  timeout: 5000, // 5초 동안 응답이 없으면 에러 처리
  headers: {
    'Content-Type': 'application/json',
  },
});

// 💡 로그인 토큰이 있으면 모든 요청에 자동으로 실어 보낸다.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 💡 토큰이 만료/무효화된 경우 서버가 401을 주면 로컬 토큰도 정리한다.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  },
);