const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// 💡 public 버킷의 객체는 인증 없이 바로 GET 가능하므로, SDK 없이 URL만 조립해서 사용한다.
export const getPublicStorageUrl = (bucket: string, path: string): string =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
