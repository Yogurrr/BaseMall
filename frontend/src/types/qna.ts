export const QNA_STATUSES = ['답변대기', '답변완료'] as const;

export interface Qna {
  id: number;
  userId: number;
  userName: string;
  question: string;
  status: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface MyQna {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  question: string;
  status: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface AdminQna {
  id: number;
  authorName: string;
  authorEmail: string;
  productId: number;
  productName: string;
  question: string;
  status: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}
