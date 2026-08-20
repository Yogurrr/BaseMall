import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

const EMPTY_FORM = {
  name: '',
  category: '',
  team: '',
  price: '',
  originalPrice: '',
  badge: '',
  stock: '0',
  description: '',
  imageUrl: '',
  detailImageUrl: '',
};

type FormState = typeof EMPTY_FORM;

const toFormState = (product?: Product): FormState => {
  if (!product) return EMPTY_FORM;
  return {
    name: product.name,
    category: product.category,
    team: product.team ?? '',
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : '',
    badge: product.badge ?? '',
    stock: String(product.stock),
    description: product.description ?? '',
    imageUrl: product.imageUrl ?? '',
    detailImageUrl: product.detailImageUrl ?? '',
  };
};

export const AdminProductNew = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const productId = id ? Number(id) : null;
  const isEditMode = productId !== null;

  const { data: categoryNames = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: teamNames = [] } = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
  const { data: badges = [] } = useQuery({ queryKey: ['badges'], queryFn: fetchBadges });
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId as number),
    enabled: isEditMode,
  });

  return (
    <div className={styles.page}>
      <div className={adminStyles.panelHeader}>
        <h1>{isEditMode ? '상품 수정' : '상품 등록'}</h1>
        <Button type="button" variant="outline" size="sm" onClick={() => navigate('/admin/products')}>
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
        <ProductForm key={productId ?? 'new'} product={product} isEditMode={isEditMode} productId={productId}
          categoryNames={categoryNames} teamNames={teamNames} badges={badges} />
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

const ProductForm = ({ product, isEditMode, productId, categoryNames, teamNames, badges }: ProductFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(() => toFormState(product));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [detailImageFile, setDetailImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const imagePreview = useObjectUrlPreview(imageFile, form.imageUrl || null);
  const detailImagePreview = useObjectUrlPreview(detailImageFile, form.detailImageUrl || null);

  // 💡 신규 등록일 때 목록이 로드되기 전에는 아직 고를 후보가 없어 form.category/team이 비어 있을 수 있다.
  // 렌더링 중에 계산 가능한 값이라 별도 effect로 state에 동기화해 넣을 필요가 없다.
  const effectiveCategory = form.category || categoryNames[0] || '';
  const effectiveTeam = form.team || teamNames[0] || '';

  const saveMutation = useMutation({
    mutationFn: (payload: ProductInput) =>
      isEditMode ? updateProduct(productId as number, payload) : createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['product', productId] });
      }
      navigate('/admin/products');
    },
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const priceValue = Number(form.price);
    if (!trimmedName || !priceValue || !effectiveCategory) return;

    let imageUrl = form.imageUrl || undefined;
    let detailImageUrl = form.detailImageUrl || undefined;
    if (imageFile || detailImageFile) {
      setUploadError(null);
      setIsUploading(true);
      try {
        if (imageFile) {
          imageUrl = (await uploadProductImage(imageFile)).imageUrl;
        }
        if (detailImageFile) {
          detailImageUrl = (await uploadProductImage(detailImageFile)).imageUrl;
        }
      } catch {
        setUploadError('이미지 업로드에 실패했습니다.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    saveMutation.mutate({
      name: trimmedName,
      category: effectiveCategory,
      team: effectiveTeam || undefined,
      price: priceValue,
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      imageUrl,
      badge: form.badge || undefined,
      stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
      description: form.description.trim() || undefined,
      detailImageUrl,
    });
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <label className={styles.titleField}>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="상품명을 입력하세요"
          required
        />
      </label>

      <div className={styles.header}>
        <div className={styles.row}>
          <label className={styles.metaField}>
            <span>카테고리</span>
            <select value={effectiveCategory} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {categoryNames.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.metaField}>
            <span>구단</span>
            <select value={effectiveTeam} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}>
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
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="39000"
              required
            />
          </label>
          <label className={styles.metaField}>
            <span>정가(선택)</span>
            <input
              type="number"
              min="0"
              value={form.originalPrice}
              onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
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
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              placeholder="50"
            />
          </label>
          <label className={styles.metaField}>
            <span>뱃지</span>
            <select
              value={form.badge}
              onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
            >
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
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="상품의 소재, 사이즈, 세탁 방법 등 자세한 설명을 작성해주세요."
        />
      </label>

      <div className={styles.attachRow}>
        <span>상세 이미지</span>
        <ProductImageUploader imagePreview={detailImagePreview} onFileChange={setDetailImageFile} />
      </div>

      <div className={styles.attachRow}>
        <span>썸네일 이미지</span>
        <ProductImageUploader imagePreview={imagePreview} onFileChange={setImageFile} />
      </div>

      {uploadError && <p className={adminStyles.error}>{uploadError}</p>}
      {saveMutation.isError && (
        <p className={adminStyles.error}>{isEditMode ? '수정에 실패했습니다.' : '등록에 실패했습니다.'}</p>
      )}

      <div className={styles.footer}>
        <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>
          취소
        </Button>
        <Button type="submit" isLoading={isUploading || saveMutation.isPending}>
          {isEditMode ? '수정 저장' : '등록'}
        </Button>
      </div>
    </form>
  );
};
