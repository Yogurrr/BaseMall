import { api } from './axiosInstance';
import type {
  Product,
  ProductInput,
  ProductPage,
  ProductStats,
  ProductStatus,
} from '../types/product';

export const PRODUCT_STATUSES: ProductStatus[] = ['판매중', '판매중지', '품절'];

export const formatPrice = (price: number) =>
  `${price.toLocaleString('ko-KR')}원`;

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
  sort?: string;
}): Promise<ProductPage> => {
  const response = await api.get<ProductPage>('/products/page', {
    params: {
      page: params.page,
      size: params.size,
      category: params.category || undefined,
      team: params.team || undefined,
      keyword: params.keyword || undefined,
      sort: params.sort || undefined,
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

export const createProduct = async (
  payload: ProductInput,
): Promise<Product> => {
  const response = await api.post<Product>('/products', payload);
  return response.data;
};

export const updateProduct = async (
  id: number,
  payload: ProductInput,
): Promise<Product> => {
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

export const updateProductStock = async (
  id: number,
  stock: number,
): Promise<Product> => {
  const response = await api.patch<Product>(`/products/${id}/stock`, { stock });
  return response.data;
};

export const updateProductStatus = async (
  id: number,
  status: ProductStatus,
): Promise<Product> => {
  const response = await api.patch<Product>(`/products/${id}/status`, {
    status,
  });
  return response.data;
};

export const fetchProductStats = async (): Promise<ProductStats> => {
  const response = await api.get<ProductStats>('/products/stats');
  return response.data;
};

export const uploadProductImage = async (
  file: File,
): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  // 💡 axiosInstance가 기본 Content-Type을 application/json으로 고정해두므로,
  // multipart 경계(boundary)를 브라우저가 직접 채우도록 여기서만 헤더를 비워준다.
  const response = await api.post<{ imageUrl: string }>(
    '/products/images',
    formData,
    {
      headers: { 'Content-Type': undefined },
    },
  );
  return response.data;
};
