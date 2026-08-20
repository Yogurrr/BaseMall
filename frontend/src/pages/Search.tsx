import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { ProductCard } from '../components/ProductCard/ProductCard';
import { Pagination } from '../components/Pagination/Pagination';
import { Spinner } from '../components/Spinner/Spinner';
import { SortSelect, type SortOption } from '../components/SortSelect/SortSelect';
import { AddToCartModal } from '../components/AddToCartModal/AddToCartModal';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAddToCartModal } from '../hooks/useAddToCartModal';
import { fetchProductsPage } from '../api/productApi';
import styles from './Search.module.css';

const PAGE_SIZE = 12;

const SORT_OPTIONS: SortOption[] = [
  { value: '', label: '추천순' },
  { value: 'popular', label: '인기순' },
  { value: 'sales', label: '판매순' },
  { value: 'priceAsc', label: '낮은가격순' },
  { value: 'priceDesc', label: '높은가격순' },
  { value: 'reviews', label: '리뷰많은순' },
  { value: 'discount', label: '할인율순' },
  { value: 'newest', label: '신상품순' },
];

export const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('');
  const { addItem } = useCart();
  const { isLiked, toggleWishlist } = useWishlist();
  const { isAddToCartModalOpen, openAddToCartModal, closeAddToCartModal, goToCheckout } = useAddToCartModal();

  // 💡 검색어가 바뀌면 페이지도 처음부터 다시 봐야 하는데, effect 대신 렌더링 중에
  // 이전 검색어와 비교해 바뀐 경우에만 조정한다.
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setPage(0);
  }

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(0);
  };

  const { data: productPage, isLoading, isError } = useQuery({
    queryKey: ['products', 'search', query, page, sort],
    queryFn: () => fetchProductsPage({ page, size: PAGE_SIZE, keyword: query, sort }),
    enabled: query.length > 0,
  });

  const products = productPage?.content ?? [];
  const totalPages = productPage?.totalPages ?? 0;
  const totalElements = productPage?.totalElements ?? 0;

  return (
    <div className={styles.page}>
      <SiteHeader />

      <section className={styles.hero}>
        <h1>{query ? `'${query}'에 대한 검색 결과` : '굿즈 검색'}</h1>
      </section>

      <div className={styles.content}>
        {!query ? (
          <p className={styles.empty}>검색어를 입력해주세요.</p>
        ) : (
          <>
            <div className={styles.resultBar}>
              {!isLoading && !isError && <p className={styles.resultLabel}>총 {totalElements}개</p>}
              <SortSelect options={SORT_OPTIONS} value={sort} onChange={handleSortChange} />
            </div>

            {isLoading ? (
              <div className={styles.empty}>
                <Spinner />
              </div>
            ) : isError ? (
              <p className={styles.empty}>검색 결과를 불러오지 못했습니다.</p>
            ) : products.length > 0 ? (
              <div className={styles.grid}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    liked={isLiked(product.id)}
                    onToggleLike={toggleWishlist}
                    onAddToCart={() => {
                      addItem(product);
                      openAddToCartModal();
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.empty}>'{query}'에 대한 검색 결과가 없습니다.</p>
            )}

            {!isLoading && !isError && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
          </>
        )}

        <Link to="/" className={styles.backLink}>
          ← 쇼핑 계속하기
        </Link>
      </div>

      <SiteFooter />

      {isAddToCartModalOpen && (
        <AddToCartModal onClose={closeAddToCartModal} onCheckout={goToCheckout} />
      )}
    </div>
  );
};
