import { api } from './axiosInstance';
import type { Badge, BadgeInput } from '../types/badge';

const DEFAULT_BADGE_GRADIENT = 'linear-gradient(120deg, #6b7280, #9ca3af)';

export const fetchBadges = async (): Promise<Badge[]> => {
  const response = await api.get<Badge[]>('/badges');
  return response.data;
};

export const createBadge = async (payload: BadgeInput): Promise<Badge> => {
  const response = await api.post<Badge>('/badges', payload);
  return response.data;
};

export const updateBadge = async (
  id: number,
  payload: BadgeInput,
): Promise<Badge> => {
  const response = await api.put<Badge>(`/badges/${id}`, payload);
  return response.data;
};

export const deleteBadge = async (id: number): Promise<void> => {
  await api.delete(`/badges/${id}`);
};

// 💡 상품 카드/상세/관리자 목록에서 뱃지를 그릴 때 공통으로 쓰는 색상 계산.
// 목록에 없는(또는 아직 로딩 중인) 뱃지 이름은 중립 회색 그라디언트로 대체해
// 흰 글씨가 배경 없이 보이지 않게 되는 것을 막는다.
export const getBadgeGradient = (
  badges: Badge[],
  name?: string | null,
): string => {
  const badge = badges.find((b) => b.name === name);
  return badge
    ? `linear-gradient(120deg, ${badge.colorFrom}, ${badge.colorTo})`
    : DEFAULT_BADGE_GRADIENT;
};
