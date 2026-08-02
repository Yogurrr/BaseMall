import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { CheckboxFilterGroup } from '../../components/CheckboxFilterGroup/CheckboxFilterGroup';
import { StockEditor } from '../../components/StockEditor/StockEditor';
import { SortableTh } from '../../components/SortableTh/SortableTh';
import { ProductStatusSelect } from '../../components/ProductStatusSelect/ProductStatusSelect';
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchDeletedProducts,
  fetchProducts,
  fetchTeams,
  formatPrice,
  restoreProduct,
  updateProduct,
  updateProductStock,
  updateProductStatus,
  PRODUCT_STATUSES,
} from '../../api/productApi';
import type { Product, ProductInput, ProductStatus } from '../../types/product';
import styles from './Admin.module.css';

type ProductSortKey = 'name' | 'category' | 'team' | 'price' | 'stock' | 'rating';
type SortDirection = 'asc' | 'desc';

const BADGE_OPTIONS = ['NEW', 'SALE', 'BEST'];

const EMPTY_FORM = {
  name: '',
  category: '',
  team: '',
  price: '',
  originalPrice: '',
  emoji: '🛒',
  badge: '' as Product['badge'] | '',
  stock: '0',
};

const toggleInSet = (set: Set<string>, value: string) => {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};

export const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortKey, setSortKey] = useState<ProductSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [teamFilter, setTeamFilter] = useState<Set<string>>(new Set());
  const [badgeFilter, setBadgeFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const hasActiveFilter =
    categoryFilter.size > 0 || teamFilter.size > 0 || badgeFilter.size > 0 || statusFilter.size > 0;

  const resetFilters = () => {
    setCategoryFilter(new Set());
    setTeamFilter(new Set());
    setBadgeFilter(new Set());
    setStatusFilter(new Set());
  };

  const handleSort = (key: ProductSortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  const {
    data: deletedProducts = [],
    isLoading: isDeletedLoading,
    isError: isDeletedError,
  } = useQuery({
    queryKey: ['products', 'deleted'],
    queryFn: fetchDeletedProducts,
    enabled: showDeleted,
  });
  const { data: categoryNames = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const { data: teamNames = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (categoryFilter.size > 0 && !categoryFilter.has(product.category)) return false;
      if (teamFilter.size > 0 && !(product.team && teamFilter.has(product.team))) return false;
      if (badgeFilter.size > 0 && !(product.badge && badgeFilter.has(product.badge))) return false;
      if (statusFilter.size > 0 && !statusFilter.has(product.status)) return false;
      return true;
    });
  }, [products, categoryFilter, teamFilter, badgeFilter, statusFilter]);

  const sortedProducts = useMemo(() => {
    if (!sortKey) return filteredProducts;
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...filteredProducts].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }
      return String(aValue ?? '').localeCompare(String(bValue ?? ''), 'ko') * direction;
    });
  }, [filteredProducts, sortKey, sortDirection]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!form.category && categoryNames.length > 0) {
      setForm((f) => ({ ...f, category: categoryNames[0] }));
    }
  }, [categoryNames]);

  useEffect(() => {
    if (!form.team && teamNames.length > 0) {
      setForm((f) => ({ ...f, team: teamNames[0] }));
    }
  }, [teamNames]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, category: categoryNames[0] ?? '', team: teamNames[0] ?? '' });
    setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: ProductInput) =>
      editingId !== null ? updateProduct(editingId, payload) : createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (editingId === id) resetForm();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: number; stock: number }) => updateProductStock(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const [statusError, setStatusError] = useState<string | null>(null);
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProductStatus }) => updateProductStatus(id, status),
    onSuccess: () => {
      setStatusError(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      setStatusError(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : '상태 변경에 실패했습니다.',
      );
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const priceValue = Number(form.price);
    if (!trimmedName || !priceValue) return;

    saveMutation.mutate({
      name: trimmedName,
      category: form.category,
      team: form.team || undefined,
      price: priceValue,
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      emoji: form.emoji || '🛒',
      badge: form.badge || undefined,
      stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
    });
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      team: product.team ?? '',
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      emoji: product.emoji,
      badge: product.badge ?? '',
      stock: String(product.stock),
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>상품 관리</h1>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowDeleted((v) => !v)}>
          {showDeleted ? '활성 상품 보기' : '삭제된 상품 보기'}
        </Button>
      </div>

      {showDeleted ? (
        <div className={styles.tableWrap}>
          {isDeletedLoading ? (
            <div className={styles.empty}><Spinner /></div>
          ) : isDeletedError ? (
            <p className={`${styles.empty} ${styles.error}`}>삭제된 상품 목록을 불러오지 못했습니다.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>상품</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {deletedProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.emoji} {product.name}
                    </td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={restoreMutation.isPending && restoreMutation.variables === product.id}
                        onClick={() => restoreMutation.mutate(product.id)}
                      >
                        복구
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isDeletedLoading && !isDeletedError && deletedProducts.length === 0 && (
            <p className={styles.empty}>삭제된 상품이 없습니다.</p>
          )}
        </div>
      ) : (
        <>
      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>전체 상품</span>
          <strong>{products.length}개</strong>
        </div>
        <div className={styles.statCard}>
          <span>세일 상품</span>
          <strong>{products.filter((p) => p.badge === 'SALE').length}개</strong>
        </div>
        <div className={styles.statCard}>
          <span>평균 평점</span>
          <strong>
            {products.length
              ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
              : '0.0'}
          </strong>
        </div>
      </section>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          상품명
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: 오버핏 셔츠"
            required
          />
        </label>
        <label className={styles.field}>
          카테고리
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {categoryNames.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          구단
          <select
            value={form.team}
            onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
          >
            {teamNames.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          가격
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="39000"
            required
          />
        </label>
        <label className={styles.field}>
          정가(선택)
          <input
            type="number"
            min="0"
            value={form.originalPrice}
            onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
            placeholder="52000"
          />
        </label>
        <label className={styles.field}>
          재고
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            placeholder="50"
          />
        </label>
        <label className={styles.field}>
          아이콘
          <input
            value={form.emoji}
            onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
            placeholder="👕"
          />
        </label>
        <label className={styles.field}>
          뱃지
          <select
            value={form.badge ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value as Product['badge'] | '' }))}
          >
            <option value="">없음</option>
            <option value="NEW">NEW</option>
            <option value="SALE">SALE</option>
            <option value="BEST">BEST</option>
          </select>
        </label>
        <div className={styles.formActions}>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {editingId !== null ? '수정 저장' : '상품 추가'}
          </Button>
          {editingId !== null && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              취소
            </Button>
          )}
        </div>
        {saveMutation.isError && <p className={styles.error}>저장에 실패했습니다.</p>}
      </form>

      {statusError && <p className={styles.error}>{statusError}</p>}

      <div className={styles.checkboxFilterBar}>
        <div className={styles.checkboxFilterGroups}>
          <CheckboxFilterGroup
            label="카테고리"
            options={categoryNames}
            selected={categoryFilter}
            onToggle={(value) => setCategoryFilter((prev) => toggleInSet(prev, value))}
          />
          <CheckboxFilterGroup
            label="구단"
            options={teamNames}
            selected={teamFilter}
            onToggle={(value) => setTeamFilter((prev) => toggleInSet(prev, value))}
          />
          <CheckboxFilterGroup
            label="뱃지"
            options={BADGE_OPTIONS}
            selected={badgeFilter}
            onToggle={(value) => setBadgeFilter((prev) => toggleInSet(prev, value))}
          />
          <CheckboxFilterGroup
            label="판매 상태"
            options={PRODUCT_STATUSES}
            selected={statusFilter}
            onToggle={(value) => setStatusFilter((prev) => toggleInSet(prev, value))}
          />
        </div>
        {hasActiveFilter && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={styles.checkboxFilterReset}
            onClick={resetFilters}
          >
            필터 초기화
          </Button>
        )}
      </div>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : isError ? (
          <p className={`${styles.empty} ${styles.error}`}>상품 목록을 불러오지 못했습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <SortableTh
                  label="상품"
                  active={sortKey === 'name'}
                  direction={sortDirection}
                  onClick={() => handleSort('name')}
                />
                <SortableTh
                  label="카테고리"
                  active={sortKey === 'category'}
                  direction={sortDirection}
                  onClick={() => handleSort('category')}
                />
                <SortableTh
                  label="구단"
                  active={sortKey === 'team'}
                  direction={sortDirection}
                  onClick={() => handleSort('team')}
                />
                <SortableTh
                  label="가격"
                  active={sortKey === 'price'}
                  direction={sortDirection}
                  onClick={() => handleSort('price')}
                />
                <SortableTh
                  label="재고"
                  active={sortKey === 'stock'}
                  direction={sortDirection}
                  onClick={() => handleSort('stock')}
                />
                <th>상태</th>
                <SortableTh
                  label="평점"
                  active={sortKey === 'rating'}
                  direction={sortDirection}
                  onClick={() => handleSort('rating')}
                />
                <th>뱃지</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.emoji} {product.name}
                  </td>
                  <td>{product.category}</td>
                  <td>{product.team ?? '-'}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>
                    <StockEditor
                      value={product.stock}
                      isSaving={stockMutation.isPending && stockMutation.variables?.id === product.id}
                      onSave={(stock) => stockMutation.mutate({ id: product.id, stock })}
                    />
                  </td>
                  <td>
                    <ProductStatusSelect
                      value={product.status}
                      isSaving={statusMutation.isPending && statusMutation.variables?.id === product.id}
                      onSave={(status) => statusMutation.mutate({ id: product.id, status })}
                    />
                  </td>
                  <td>⭐ {product.rating}</td>
                  <td>
                    {product.badge && (
                      <span className={`${styles.badge} ${styles[`badge${product.badge}`]}`}>
                        {product.badge}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={deleteMutation.isPending && deleteMutation.variables === product.id}
                        onClick={() => handleDelete(product.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && !isError && products.length === 0 && (
          <p className={styles.empty}>등록된 상품이 없습니다.</p>
        )}
        {!isLoading && !isError && products.length > 0 && sortedProducts.length === 0 && (
          <p className={styles.empty}>필터 조건에 맞는 상품이 없습니다.</p>
        )}
      </div>
        </>
      )}
    </>
  );
};
