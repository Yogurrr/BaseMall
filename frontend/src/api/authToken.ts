type Listener = () => void;
const listeners = new Set<Listener>();

const notifyAuthChange = () => {
  listeners.forEach((listener) => listener());
};

// 💡 로그인/로그아웃이 다른 컴포넌트(예: 장바구니)에 알림을 줄 수 있도록 구독 지점을 둔다.
export const subscribeAuthChange = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// 💡 액세스 토큰은 localStorage가 아니라 모듈 스코프 변수(=탭 메모리)에만 둔다 — XSS로 스크립트가
// 실행돼도 localStorage처럼 영구 저장소를 뒤질 필요 없이 훔칠 수 있는 걸 막는다. 새로고침하면
// 이 변수는 비워지고, 대신 axiosInstance.refreshAccessToken()이 httpOnly 리프레시 쿠키로
// 조용히 재발급받아 채운다(App.tsx/RequireAuth.tsx 참고).
let accessToken: string | null = null;

export const getToken = (): string | null => accessToken;

export const setToken = (token: string): void => {
  accessToken = token;
  notifyAuthChange();
};

export const clearToken = (): void => {
  accessToken = null;
  notifyAuthChange();
};

export const isLoggedIn = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
