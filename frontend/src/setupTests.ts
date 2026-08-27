import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 💡 globals: true를 안 쓰기로 했으므로(테스트 파일마다 명시적으로 import), RTL이 자동으로
// 감지하는 afterEach 전역이 없다 — cleanup을 직접 등록해야 테스트 간 DOM이 안 새어나간다.
afterEach(() => {
  cleanup();
});
