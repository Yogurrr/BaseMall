import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { ProductCard } from '../components/ProductCard/ProductCard';
import { Pagination } from '../components/Pagination/Pagination';
import { Spinner } from '../components/Spinner/Spinner';
import { useCart } from '../context/CartContext';
import { fetchProductsPage } from '../api/productApi';
import styles from './Search.module.css';

const PAGE_SIZE = 12;

export const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') ?? '';
  const [page, setPage] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const { addItem } = useCart();

  useEffect(() => {
    setPage(0);
  }, [query]);

  const { data: productPage, isLoading, isError } = useQuery({
    queryKey: ['products', 'search', query, page],
    queryFn: () => fetchProductsPage({ page, size: PAGE_SIZE, keyword: query }),
    enabled: query.length > 0,
  });

  const products = productPage?.content ?? [];
  const totalPages = productPage?.totalPages ?? 0;
  const totalElements = productPage?.totalElements ?? 0;

  const handleSearch = (keyword: string) => {
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const toggleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <SiteHeader />

      <section className={styles.hero}>
        <h1>굿즈 검색</h1>
        <SearchBar
          size="lg"
          defaultValue={query}
          placeholder="찾으시는 구단·상품명을 검색해보세요"
          onSearch={handleSearch}
        />
      </section>

      <div className={styles.content}>
        {!query ? (
          <p className={styles.empty}>검색어를 입력해주세요.</p>
        ) : (
          <>
            <p className={styles.resultLabel}>
              <strong>'{query}'</strong> 검색 결과{!isLoading && !isError ? ` ${totalElements}개` : ''}
            </p>

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
                    liked={likedIds.has(product.id)}
                    onToggleLike={toggleLike}
                    onAddToCart={() => addItem(product)}
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
    </div>
  );
};
