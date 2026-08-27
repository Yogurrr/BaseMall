// 💡 카카오 로그인(로그인 화면)과 마이페이지 계정 연동이 서로 다른 redirect_uri를 쓰지만
// 인가 URL을 만드는 방식은 동일해서 공용 유틸로 뺐다.
const KAKAO_OAUTH_STATE_KEY = 'kakaoOAuthState';

// 💡 state 없이 code만으로 콜백을 처리하면, 공격자가 자기 계정으로 발급받은 인가 code를
// 로그인된 피해자의 브라우저에서 콜백 URL로 열게 만들어 자신의 카카오 계정을 피해자 계정에
// 연동시키는 CSRF가 가능하다. 이 탭이 실제로 인가를 시작했는지 sessionStorage의 1회용
// state로 확인해서 막는다.
export const buildKakaoAuthorizeUrl = (redirectPath: string, scope: string) => {
  const state = crypto.randomUUID();
  sessionStorage.setItem(KAKAO_OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_KAKAO_CLIENT_ID,
    redirect_uri: `${window.location.origin}${redirectPath}`,
    response_type: 'code',
    scope,
    state,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
};

// 콜백에서 받은 state가 이 탭이 저장해둔 값과 일치하는지 확인한다. 위조/재사용을 막기 위해
// 저장된 값은 검증과 동시에 지운다(1회용).
export const consumeKakaoOAuthState = (receivedState: string | null) => {
  const expected = sessionStorage.getItem(KAKAO_OAUTH_STATE_KEY);
  sessionStorage.removeItem(KAKAO_OAUTH_STATE_KEY);
  return Boolean(expected) && expected === receivedState;
};
