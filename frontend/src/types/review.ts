export interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface MyReview {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  rating: number;
  content: string;
  createdAt: string;
}

export interface ReviewableItem {
  productId: number;
  productName: string;
  productImageUrl: string | null;
  purchasedAt: string;
}
