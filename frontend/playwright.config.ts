import { defineConfig, devices } from '@playwright/test';

// 💡 백엔드(Spring Boot, application-local.properties 필요)는 이 config가 대신 띄워줄 수 없으므로
// e2e 실행 전 `cd backend && ./mvnw spring-boot:run`으로 미리 켜둬야 한다. 프론트만 webServer로 자동 기동한다.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
