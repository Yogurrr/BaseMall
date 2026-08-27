import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { ProductImageUploader } from '../../components/ProductImageUploader/ProductImageUploader';
import { useObjectUrlPreview } from '../../hooks/useObjectUrlPreview';
import {
  createProduct,
  fetchCategories,
  fetchProduct,
  fetchTeams,
  updateProduct,
  uploadProductImage,
} from '../../api/productApi';
import { fetchBadges } from '../../api/badgeApi';
import type { Badge } from '../../types/badge';
import type { Product, ProductInput } from '../../types/product';
import adminStyles from './Admin.module.css';
import styles from './AdminProductNew.module.css';

const productSchema = z
  .object({
    name: z.string(),
    category: z.string(),
    team: z.string(),
    price: z.string(),
    originalPrice: z.string(),
    badge: z.string(),
    stock: z.string(),
    description: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.name.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: '상품명을 입력해주세요.',
      });
    }
    if (!values.category) {
      ctx.addIssue({
        code: 'custom',
        path: ['category'],
        message: '카테고리를 선택해주세요.',
      });
    }
    const priceValue = Number(values.price);
    if (!priceValue || priceValue <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['price'],
        message: '가격을 입력해주세요.',
      });
    }
  });

type ProductFormValues = z.infer<typeof productSchema>;

export const AdminProductNew = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = id ? Number(id) : null;
  const isEditMode = productId !== null;

  const { data: categoryNames = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const { data: teamNames = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });
  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: fetchBadges,
  });
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId as number),
    enabled: isEditMode,
  });

  return (
    <div className={styles.page}>
      <div className={adminStyles.panelHeader}>
        <h1>{isEditMode ? '상품 수정' : '상품 등록'}</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/products')}
        >
          목록으로
        </Button>
      </div>

      {isEditMode && isProductLoading ? (
        <div className={adminStyles.empty}>
          <Spinner />
        </div>
      ) : (
        // 💡 productId가 바뀌면(다른 상품 수정으로 이동) 폼 상태를 처음부터 다시 초기화해야 하므로 key로 리마운트시킨다.
        // 이 지점에 도달했을 때는(스피너를 벗어난 시점) edit 모드면 이미 product가 로드된 뒤라, effect 없이
        // 최초 렌더링에서 바로 product 데이터로 상태를 초기화할 수 있다.
        <ProductForm
          key={productId ?? 'new'}
          product={product}
          isEditMode={isEditMode}
          productId={productId}
          categoryNames={categoryNames}
          teamNames={teamNames}
          badges={badges}
        />
      )}
    </div>
  );
};

interface ProductFormProps {
  product?: Product;
  isEditMode: boolean;
  productId: number | null;
  categoryNames: string[];
  teamNames: string[];
  badges: Badge[];
}

const ProductForm = ({
  product,
  isEditMode,
  productId,
  categoryNames,
  teamNames,
  badges,
}: ProductFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const imageUrl = product?.imageUrl ?? '';
  const detailImageUrl = product?.detailImageUrl ?? '';
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [detailImageFile, setDetailImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const imagePreview = useObjectUrlPreview(imageFile, imageUrl || null);
  const detailImagePreview = useObjectUrlPreview(
    detailImageFile,
    detailImageUrl || null,
  );

  const { register, handleSubmit, setValue, getValues } =
    useForm<ProductFormValues>({
      resolver: zodResolver(productSchema),
      defaultValues: {
        name: product?.name ?? '',
        category: product?.category ?? '',
        team: product?.team ?? '',
        price: product ? String(product.price) : '',
        originalPrice: product?.originalPrice
          ? String(product.originalPrice)
          : '',
        badge: product?.badge ?? '',
        stock: product ? String(product.stock) : '0',
        description: product?.description ?? '',
      },
    });

  // 💡 신규 등록 시 카테고리/구단 목록이 폼 마운트 이후 비동기로 도착할 수 있어, 도착 시점에 첫 값을 기본 선택으로 채워준다.
  useEffect(() => {
    if (!getValues('category') && categoryNames.length > 0) {
      setValue('category', categoryNames[0]);
    }
  }, [categoryNames, getValues, setValue]);

  useEffect(() => {
    if (!getValues('team') && teamNames.length > 0) {
      setValue('team', teamNames[0]);
    }
  }, [teamNames, getValues, setValue]);

  const saveMutation = useMutation({
    mutationFn: (payload: ProductInput) =>
      isEditMode
        ? updateProduct(productId as number, payload)
        : createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['product', productId] });
      }
      toast.success(
        isEditMode ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.',
      );
      navigate('/admin/products');
    },
    onError: () =>
      toast.error(isEditMode ? '수정에 실패했습니다.' : '등록에 실패했습니다.'),
  });

  const onSubmit = async (values: ProductFormValues) => {
    let nextImageUrl = imageUrl || undefined;
    let nextDetailImageUrl = detailImageUrl || undefined;
    if (imageFile || detailImageFile) {
      setIsUploading(true);
      try {
        if (imageFile) {
          nextImageUrl = (await uploadProductImage(imageFile)).imageUrl;
        }
        if (detailImageFile) {
          nextDetailImageUrl = (await uploadProductImage(detailImageFile))
            .imageUrl;
        }
      } catch {
        toast.error('이미지 업로드에 실패했습니다.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    saveMutation.mutate({
      name: values.name.trim(),
      category: values.category,
      team: values.team || undefined,
      price: Number(values.price),
      originalPrice: values.originalPrice
        ? Number(values.originalPrice)
        : undefined,
      imageUrl: nextImageUrl,
      badge: values.badge || undefined,
      stock: Math.max(0, Math.floor(Number(values.stock) || 0)),
      description: values.description.trim() || undefined,
      detailImageUrl: nextDetailImageUrl,
    });
  };

  const onInvalid = (formErrors: FieldErrors<ProductFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;
    toast.error(
      typeof firstMessage === 'string'
        ? firstMessage
        : '입력값을 확인해주세요.',
    );
  };

  return (
    <form
      className={styles.card}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
    >
      <label className={styles.titleField}>
        <input {...register('name')} placeholder="상품명을 입력하세요" />
      </label>

      <div className={styles.header}>
        <div className={styles.row}>
          <label className={styles.metaField}>
            <span>카테고리</span>
            <select {...register('category')}>
              {categoryNames.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.metaField}>
            <span>구단</span>
            <select {...register('team')}>
              {teamNames.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.metaField}>
            <span>가격</span>
            <input
              type="number"
              min="0"
              {...register('price')}
              placeholder="39000"
            />
          </label>
          <label className={styles.metaField}>
            <span>정가(선택)</span>
            <input
              type="number"
              min="0"
              {...register('originalPrice')}
              placeholder="52000"
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.metaField}>
            <span>재고</span>
            <input
              type="number"
              min="0"
              {...register('stock')}
              placeholder="50"
            />
          </label>
          <label className={styles.metaField}>
            <span>뱃지</span>
            <select {...register('badge')}>
              <option value="">없음</option>
              {badges.map((badge) => (
                <option key={badge.id} value={badge.name}>
                  {badge.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <label className={styles.contentField}>
        <textarea
          {...register('description')}
          placeholder="상품의 소재, 사이즈, 세탁 방법 등 자세한 설명을 작성해주세요."
        />
      </label>

      <div className={styles.attachRow}>
        <span>상세 이미지</span>
        <ProductImageUploader
          imagePreview={detailImagePreview}
          onFileChange={setDetailImageFile}
        />
      </div>

      <div className={styles.attachRow}>
        <span>썸네일 이미지</span>
        <ProductImageUploader
          imagePreview={imagePreview}
          onFileChange={setImageFile}
        />
      </div>

      <div className={styles.footer}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/admin/products')}
        >
          취소
        </Button>
        <Button type="submit" isLoading={isUploading || saveMutation.isPending}>
          {isEditMode ? '수정 저장' : '등록'}
        </Button>
      </div>
    </form>
  );
};
