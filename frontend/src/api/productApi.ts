import { api } from './axiosInstance';

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
}

export interface ProductInput {
  name: string;
  category: string;
  team?: string;
  price: number;
  originalPrice?: number;
  emoji: string;
  badge?: 'NEW' | 'SALE' | 'BEST';
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

export const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export const fetchCategories = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/categories');
  return response.data;
};

export const fetchTeams = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/teams');
  return response.data;
};

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get<Product[]>('/products');
  return response.data;
};

export const fetchProductsPage = async (params: {
  page: number;
  size: number;
  category?: string;
  team?: string;
  keyword?: string;
}): Promise<ProductPage> => {
  const response = await api.get<ProductPage>('/products/page', {
    params: {
      page: params.page,
      size: params.size,
      category: params.category || undefined,
      team: params.team || undefined,
      keyword: params.keyword || undefined,
    },
  });
  return response.data;
};

export const fetchProduct = async (id: number): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
};

export const fetchDeletedProducts = async (): Promise<Product[]> => {
  const response = await api.get<Product[]>('/products/deleted');
  return response.data;
};

export const createProduct = async (payload: ProductInput): Promise<Product> => {
  const response = await api.post<Product>('/products', payload);
  return response.data;
};

export const updateProduct = async (id: number, payload: ProductInput): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, payload);
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const restoreProduct = async (id: number): Promise<Product> => {
  const response = await api.patch<Product>(`/products/${id}/restore`);
  return response.data;
};
