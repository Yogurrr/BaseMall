import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnnouncementBar } from '../components/AnnouncementBar/AnnouncementBar';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { AdBanner, type AdSlide } from '../components/AdBanner/AdBanner';
import { CategoryTabs } from '../components/CategoryTabs/CategoryTabs';
import { ProductCard } from '../components/ProductCard/ProductCard';
import { Pagination } from '../components/Pagination/Pagination';
import {
  SortSelect,
  type SortOption,
} from '../components/SortSelect/SortSelect';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { Spinner } from '../components/Spinner/Spinner';
import { RecommendedProducts } from '../components/RecommendedProducts/RecommendedProducts';
import { useWishlist } from '../hooks/useWishlist';
import { useCurrentUser } from '../hooks/useCurrentUser';
import {
  fetchCategories,
  fetchProductsPage,
  fetchTeams,
} from '../api/productApi';
import { fetchActiveBanners } from '../api/bannerApi';
import styles from './Home.module.css';

const PAGE_SIZE = 10;

const SORT_OPTIONS: SortOption[] = [
  { value: '', label: '추천순' },
  { value: 'newest', label: '최신순' },
  { value: 'priceAsc', label: '낮은가격순' },
  { value: 'priceDesc', label: '높은가격순' },
];

export const Home = () => {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(
    () => searchParams.get('category') || '전체',
  );
  const [activeTeam, setActiveTeam] = useState(
    () => searchParams.get('team') || '전체',
  );
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('');
  const { isLiked, toggleWishlist } = useWishlist();
  const { data: currentUser } = useCurrentUser();

  const {
    data: productPage,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['products', 'page', page, activeCategory, activeTeam, sort],
    queryFn: () =>
      fetchProductsPage({
        page,
        size: PAGE_SIZE,
        category: activeCategory === '전체' ? undefined : activeCategory,
        team: activeTeam === '전체' ? undefined : activeTeam,
        sort,
      }),
  });

  const products = productPage?.content ?? [];
  const totalPages = productPage?.totalPages ?? 0;

  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: fetchActiveBanners,
  });
  const adSlides: AdSlide[] = useMemo(
    () =>
      banners.map((banner) => ({
        id: banner.id,
        eyebrow: banner.eyebrow,
        title: banner.title,
        description: banner.description,
        ctaLabel: banner.ctaLabel,
        gradient: banner.gradient,
        image: banner.imageUrl ?? undefined,
      })),
    [banners],
  );

  const { data: categoryNames = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const categoryTabs = useMemo(
    () => ['전체', ...categoryNames],
    [categoryNames],
  );

  const { data: teamNames = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });
  const teamTabs = useMemo(() => ['전체', ...teamNames], [teamNames]);

  // 💡 카테고리/구단 네비게이션 링크를 눌러 URL 쿼리가 바뀌면(같은 라우트라 리마운트되지 않음)
  // 탭 선택 상태도 맞춰야 하는데, effect 대신 렌더링 중에 이전 searchParams와 비교해 조정한다.
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams);
  if (searchParams !== prevSearchParams) {
    setPrevSearchParams(searchParams);
    setActiveCategory(searchParams.get('category') || '전체');
    setActiveTeam(searchParams.get('team') || '전체');
    setPage(0);
  }

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category);
    setPage(0);
  };

  const handleSelectTeam = (team: string) => {
    setActiveTeam(team);
    setPage(0);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(0);
  };

  return (
    <div className={styles.page}>
      <AnnouncementBar message="⚾ 전 구단 굿즈 모음 · 신규 가입 시 15% 할인 쿠폰 증정 · 5만원 이상 구매 시 무료배송" />

      <SiteHeader />

      <AdBanner slides={adSlides} />

      {/* <PerksBar perks={PERKS} /> */}

      {currentUser?.favoriteTeam && (
        <RecommendedProducts team={currentUser.favoriteTeam} />
      )}

      <p className={styles.filterLabel}>상품 종류</p>
      <CategoryTabs
        sectionId="products"
        categories={categoryTabs}
        active={activeCategory}
        onSelect={handleSelectCategory}
      />

      <p className={styles.filterLabel}>구단별</p>
      <CategoryTabs
        categories={teamTabs}
        active={activeTeam}
        onSelect={handleSelectTeam}
      />

      <section id="best" className={styles.products}>
        <div className={styles.sectionHeader}>
          <h2>베스트 굿즈</h2>
          <SortSelect
            options={SORT_OPTIONS}
            value={sort}
            onChange={handleSortChange}
          />
        </div>
        {isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : isError ? (
          <p className={styles.empty}>상품을 불러오지 못했습니다.</p>
        ) : products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                liked={isLiked(product.id)}
                onToggleLike={toggleWishlist}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>해당 카테고리의 상품이 없습니다.</p>
        )}

        {!isLoading && !isError && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        )}
      </section>

      <SiteFooter />
    </div>
  );
};
