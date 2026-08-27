export const INQUIRY_CATEGORIES = [
  '상품문의',
  '배송문의',
  '교환/환불',
  '결제/주문',
  '기타',
] as const;
export const INQUIRY_STATUSES = ['답변대기', '답변완료'] as const;

export interface Inquiry {
  id: number;
  category: string;
  title: string;
  content: string;
  imageUrl: string | null;
  orderId: number | null;
  status: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface AdminInquiry extends Inquiry {
  authorName: string;
  authorEmail: string;
}
