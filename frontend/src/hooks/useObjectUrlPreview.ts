import { useEffect, useState } from 'react';

// 💡 File → Blob URL 생성/해제는 브라우저 리소스와의 동기화라 useEffect가 정석 용례다.
// (선택한 파일이 있으면 그걸로, 없으면 fallbackUrl로 미리보기를 보여준다)
export const useObjectUrlPreview = (
  file: File | null,
  fallbackUrl: string | null,
): string | null => {
  const [preview, setPreview] = useState<string | null>(fallbackUrl);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Blob URL 생성/해제는 외부 시스템(브라우저) 동기화라 effect 밖에서 계산할 수 없다.
      setPreview(fallbackUrl);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, fallbackUrl]);

  return preview;
};
