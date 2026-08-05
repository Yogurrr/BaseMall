export interface Product {
  id: number;
  name: string;
  category: string;
  team?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  imageUrl?: string | null;
  badge?: string;
  stock: number;
  status: ProductStatus;
  description?: string | null;
  detailImageUrl?: string | null;
}

export type ProductStatus = '판매중' | '판매중지' | '품절';

export interface ProductInput {
  name: string;
  category: string;
  team?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string | null;
  badge?: string;
  stock: number;
  description?: string;
  detailImageUrl?: string | null;
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

export interface ProductRankRow {
  id: number;
  name: string;
  imageUrl?: string | null;
  category: string;
  soldCount: number;
}

export interface CategorySalesRow {
  category: string;
  soldCount: number;
}

export interface ProductStats {
  topProducts: ProductRankRow[];
  categorySales: CategorySalesRow[];
  outOfStockCount: number;
}
