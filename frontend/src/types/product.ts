export interface Product {
  id: number;
  name: string;
  category: string;
  team?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  emoji: string;
  badge?: 'NEW' | 'SALE' | 'BEST';
  stock: number;
  status: ProductStatus;
}

export type ProductStatus = '판매중' | '판매중지' | '품절';

export interface ProductInput {
  name: string;
  category: string;
  team?: string;
  price: number;
  originalPrice?: number;
  emoji: string;
  badge?: 'NEW' | 'SALE' | 'BEST';
  stock: number;
}

export interface ProductPage {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
