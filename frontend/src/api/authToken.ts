const TOKEN_KEY = 'auth_token';

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

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  notifyAuthChange();
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
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
