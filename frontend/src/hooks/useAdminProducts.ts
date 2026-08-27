import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import {
  deleteProduct,
  fetchCategories,
  fetchDeletedProducts,
  fetchProducts,
  fetchTeams,
  restoreProduct,
  updateProductStock,
  updateProductStatus,
} from '../api/productApi';
import { fetchBadges } from '../api/badgeApi';
import type { ProductStatus } from '../types/product';

export const useAdminProducts = (showDeleted: boolean) => {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  const deletedProductsQuery = useQuery({
    queryKey: ['products', 'deleted'],
    queryFn: fetchDeletedProducts,
    enabled: showDeleted,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
  const badgesQuery = useQuery({ queryKey: ['badges'], queryFn: fetchBadges });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('삭제에 실패했습니다.'),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('복구에 실패했습니다.'),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: number; stock: number }) =>
      updateProductStock(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('재고 수정에 실패했습니다.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProductStatus }) =>
      updateProductStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : '상태 변경에 실패했습니다.',
      );
    },
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    deletedProducts: deletedProductsQuery.data ?? [],
    isDeletedLoading: deletedProductsQuery.isLoading,
    isDeletedError: deletedProductsQuery.isError,
    categoryNames: categoriesQuery.data ?? [],
    teamNames: teamsQuery.data ?? [],
    badges: badgesQuery.data ?? [],
    deleteMutation,
    restoreMutation,
    stockMutation,
    statusMutation,
  };
};
