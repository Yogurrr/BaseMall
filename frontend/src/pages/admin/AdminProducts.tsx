import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { CheckboxFilterGroup } from '../../components/CheckboxFilterGroup/CheckboxFilterGroup';
import { StockEditor } from '../../components/StockEditor/StockEditor';
import { SortableTh } from '../../components/SortableTh/SortableTh';
import { ProductStatusSelect } from '../../components/ProductStatusSelect/ProductStatusSelect';
import { ProductThumb } from '../../components/ProductThumb/ProductThumb';
import { formatPrice, PRODUCT_STATUSES } from '../../api/productApi';
import { getBadgeGradient } from '../../api/badgeApi';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import styles from './Admin.module.css';

type ProductSortKey =
  'name' | 'category' | 'team' | 'price' | 'stock' | 'rating';
type SortDirection = 'asc' | 'desc';

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
  const navigate = useNavigate();
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortKey, setSortKey] = useState<ProductSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [teamFilter, setTeamFilter] = useState<Set<string>>(new Set());
  const [badgeFilter, setBadgeFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const hasActiveFilter =
    categoryFilter.size > 0 ||
    teamFilter.size > 0 ||
    badgeFilter.size > 0 ||
    statusFilter.size > 0;

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

  const {
    products,
    isLoading,
    isError,
    deletedProducts,
    isDeletedLoading,
    isDeletedError,
    categoryNames,
    teamNames,
    badges,
    deleteMutation,
    restoreMutation,
    stockMutation,
    statusMutation,
  } = useAdminProducts(showDeleted);
  const badgeNames = useMemo(() => badges.map((badge) => badge.name), [badges]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (categoryFilter.size > 0 && !categoryFilter.has(product.category))
        return false;
      if (
        teamFilter.size > 0 &&
        !(product.team && teamFilter.has(product.team))
      )
        return false;
      if (
        badgeFilter.size > 0 &&
        !(product.badge && badgeFilter.has(product.badge))
      )
        return false;
      if (statusFilter.size > 0 && !statusFilter.has(product.status))
        return false;
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
      return (
        String(aValue ?? '').localeCompare(String(bValue ?? ''), 'ko') *
        direction
      );
    });
  }, [filteredProducts, sortKey, sortDirection]);

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>상품 관리</h1>
        <div className={styles.rowActions}>
          <Button
            type="button"
            size="sm"
            onClick={() => navigate('/admin/products/new')}
          >
            상품 등록
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDeleted((v) => !v)}
          >
            {showDeleted ? '활성 상품 보기' : '삭제된 상품 보기'}
          </Button>
        </div>
      </div>

      {showDeleted ? (
        <div className={styles.tableWrap}>
          {isDeletedLoading ? (
            <div className={styles.empty}>
              <Spinner />
            </div>
          ) : isDeletedError ? (
            <p className={`${styles.empty} ${styles.error}`}>
              삭제된 상품 목록을 불러오지 못했습니다.
            </p>
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
                      <ProductThumb
                        imageUrl={product.imageUrl}
                        alt={product.name}
                        size="sm"
                      />{' '}
                      {product.name}
                    </td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={
                          restoreMutation.isPending &&
                          restoreMutation.variables === product.id
                        }
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
          {!isDeletedLoading &&
            !isDeletedError &&
            deletedProducts.length === 0 && (
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
              <strong>
                {products.filter((p) => p.badge === 'SALE').length}개
              </strong>
            </div>
            <div className={styles.statCard}>
              <span>평균 평점</span>
              <strong>
                {products.length
                  ? (
                      products.reduce((sum, p) => sum + p.rating, 0) /
                      products.length
                    ).toFixed(1)
                  : '0.0'}
              </strong>
            </div>
          </section>

          <div className={styles.checkboxFilterBar}>
            <div className={styles.checkboxFilterGroups}>
              <CheckboxFilterGroup
                label="카테고리"
                options={categoryNames}
                selected={categoryFilter}
                onToggle={(value) =>
                  setCategoryFilter((prev) => toggleInSet(prev, value))
                }
              />
              <CheckboxFilterGroup
                label="구단"
                options={teamNames}
                selected={teamFilter}
                onToggle={(value) =>
                  setTeamFilter((prev) => toggleInSet(prev, value))
                }
              />
              <CheckboxFilterGroup
                label="뱃지"
                options={badgeNames}
                selected={badgeFilter}
                onToggle={(value) =>
                  setBadgeFilter((prev) => toggleInSet(prev, value))
                }
              />
              <CheckboxFilterGroup
                label="판매 상태"
                options={PRODUCT_STATUSES}
                selected={statusFilter}
                onToggle={(value) =>
                  setStatusFilter((prev) => toggleInSet(prev, value))
                }
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
              <div className={styles.empty}>
                <Spinner />
              </div>
            ) : isError ? (
              <p className={`${styles.empty} ${styles.error}`}>
                상품 목록을 불러오지 못했습니다.
              </p>
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
                        <ProductThumb
                          imageUrl={product.imageUrl}
                          alt={product.name}
                          size="sm"
                        />{' '}
                        {product.name}
                      </td>
                      <td>{product.category}</td>
                      <td>{product.team ?? '-'}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td>
                        <StockEditor
                          value={product.stock}
                          isSaving={
                            stockMutation.isPending &&
                            stockMutation.variables?.id === product.id
                          }
                          onSave={(stock) =>
                            stockMutation.mutate({ id: product.id, stock })
                          }
                        />
                      </td>
                      <td>
                        <ProductStatusSelect
                          value={product.status}
                          isSaving={
                            statusMutation.isPending &&
                            statusMutation.variables?.id === product.id
                          }
                          onSave={(status) =>
                            statusMutation.mutate({ id: product.id, status })
                          }
                        />
                      </td>
                      <td>⭐ {product.rating}</td>
                      <td>
                        {product.badge && (
                          <span
                            className={styles.badge}
                            style={{
                              background: getBadgeGradient(
                                badges,
                                product.badge,
                              ),
                            }}
                          >
                            {product.badge}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/admin/products/${product.id}/edit`)
                            }
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            isLoading={
                              deleteMutation.isPending &&
                              deleteMutation.variables === product.id
                            }
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
            {!isLoading &&
              !isError &&
              products.length > 0 &&
              sortedProducts.length === 0 && (
                <p className={styles.empty}>
                  필터 조건에 맞는 상품이 없습니다.
                </p>
              )}
          </div>
        </>
      )}
    </>
  );
};
