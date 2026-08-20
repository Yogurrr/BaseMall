// 💡 8자 이상 + 영문/숫자/특수문자 중 2가지 이상 조합, 그 외 문자(한글/공백 등)는 허용하지 않는다.
// 백엔드 AuthService의 PASSWORD_PATTERN과 동일한 규칙을 유지해야 한다.
export const PASSWORD_PATTERN = /^(?=.{8,})(?:(?=.*[A-Za-z])(?=.*\d)|(?=.*[A-Za-z])(?=.*[!@#$%^&*()_+=-])|(?=.*\d)(?=.*[!@#$%^&*()_+=-]))[A-Za-z\d!@#$%^&*()_+=-]+$/;
export const PASSWORD_RULE_MESSAGE = '비밀번호는 8자 이상이며 영문/숫자/특수문자 중 2가지 이상을 조합해야 합니다.';

// 💡 휴대폰번호는 010-1234-5678처럼 하이픈으로 구분된 형식만 허용한다.
export const PHONE_PATTERN = /^01[016789]-\d{3,4}-\d{4}$/;
export const PHONE_RULE_MESSAGE = '휴대폰번호는 010-1234-5678 형식으로 입력해주세요.';

// 💡 <input pattern="...">은 앞뒤 ^ $ 없이 전체 문자열 기준으로 이미 매칭하므로 잘라내서 넘겨준다.
const toInputPattern = (pattern: RegExp) => pattern.source.replace(/^\^/, '').replace(/\$$/, '');

export const PASSWORD_INPUT_PATTERN = toInputPattern(PASSWORD_PATTERN);
export const PHONE_INPUT_PATTERN = toInputPattern(PHONE_PATTERN);
