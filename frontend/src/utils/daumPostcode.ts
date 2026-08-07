import type { DaumPostcodeResult } from '../types/daumPostcode';

const DAUM_POSTCODE_SRC = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

let loadingPromise: Promise<void> | null = null;

const loadDaumPostcodeScript = (): Promise<void> => {
  if (window.daum?.Postcode) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = DAUM_POSTCODE_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('주소 검색 스크립트를 불러오지 못했습니다.'));
    };
    document.head.appendChild(script);
  });

  return loadingPromise;
};

export const openDaumPostcode = async (onComplete: (data: DaumPostcodeResult) => void) => {
  await loadDaumPostcodeScript();
  new window.daum!.Postcode({
    oncomplete: onComplete,
  }).open();
};
