import type { Product } from './product';

// 💡 최근 본 상품. Product 필드에 조회 시각(viewedAt)만 얹는다(WishlistItem 타입과 동일한 얇은 확장 패턴).
export type RecentViewItem = Product & { viewedAt: string };
