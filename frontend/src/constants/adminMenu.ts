export interface AdminMenuItem {
  key: string;
  label: string;
}

export const ADMIN_MENU: AdminMenuItem[] = [
  { key: 'products', label: '상품 관리' },
  { key: 'orders', label: '주문 관리' },
  { key: 'users', label: '회원 관리' },
  { key: 'categories', label: '카테고리 관리' },
  { key: 'coupons', label: '쿠폰 관리' },
  { key: 'banners', label: '배너 관리' },
  { key: 'inquiries', label: '문의 관리' },
  { key: 'qna', label: '상품 Q&A 관리' },
  { key: 'stats', label: '통계' },
  { key: 'sales', label: '매출' },
];
