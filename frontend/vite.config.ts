/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 프론트엔드에서 /api 로 시작하는 요청을 백엔드로 자동 전달
      // 💡 Docker Compose에서는 컨테이너 네트워크 안에서 localhost가 자기 자신을 가리키므로
      // VITE_API_PROXY_TARGET(예: http://backend:8080)으로 오버라이드한다.
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
});
