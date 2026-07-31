import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnnouncementBar } from '../components/AnnouncementBar/AnnouncementBar';
import { SiteHeader } from '../components/SiteHeader/SiteHeader';
import { AdBanner, type AdSlide } from '../components/AdBanner/AdBanner';
import { PerksBar, type Perk } from '../components/PerksBar/PerksBar';
import { CategoryTabs } from '../components/CategoryTabs/CategoryTabs';
import { ProductCard } from '../components/ProductCard/ProductCard';
import { Pagination } from '../components/Pagination/Pagination';
import { SiteFooter } from '../components/SiteFooter/SiteFooter';
import { Spinner } from '../components/Spinner/Spinner';
import { useCart } from '../context/CartContext';
import { fetchCategories, fetchProductsPage, fetchTeams } from '../api/productApi';
import { getPublicStorageUrl } from '../api/supabaseStorage';
import styles from './Home.module.css';

const PAGE_SIZE = 10;
const BANNER_BUCKET = 'banners';

const AD_SLIDES: AdSlide[] = [
  {
    eyebrow: 'SEASON OPENING',
    title: '🏆 2026 시즌 개막 기념 굿즈 최대 50% 할인',
    description: '내가 응원하는 구단 굿즈, 지금이 기회!',
    ctaLabel: '지금 쇼핑하기',
    gradient: 'linear-gradient(120deg, #f97316, #dc2626)',
    image: getPublicStorageUrl(BANNER_BUCKET, 'ad_banner_1.png'),
  },
  {
    eyebrow: 'WELCOME GIFT',
    title: '🎁 신규 회원 웰컴 혜택',
    description: '첫 구매 시 15% 할인 쿠폰을 드려요',
    ctaLabel: '혜택 받기',
    gradient: 'linear-gradient(120deg, #7c3aed, #ec4899)',
    image: getPublicStorageUrl(BANNER_BUCKET, 'welcome.jpg'),
  },
  {
    eyebrow: 'FREE SHIPPING',
    title: '⚾ 전 구단 굿즈 무료배송 이벤트',
    description: '5만원 이상 구매 시 배송비 걱정 끝',
    ctaLabel: '자세히 보기',
    gradient: 'linear-gradient(120deg, #0891b2, #10b981)',
    image: getPublicStorageUrl(BANNER_BUCKET, 'free-shipping.jpg'),
  },
];

const PERKS: Perk[] = [
  { icon: '🚚', title: '무료배송', description: '5만원 이상 구매 시' },
  { icon: '⚡', title: '당일출고', description: '오후 2시 이전 주문 건' },
  { icon: '💳', title: '무이자할부', description: '카드사 최대 6개월' },
];

export const Home = () => {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('category') || '전체');
  const [activeTeam, setActiveTeam] = useState(() => searchParams.get('team') || '전체');
  const [page, setPage] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const { addItem } = useCart();

  const { data: productPage, isLoading, isError } = useQuery({
    queryKey: ['products', 'page', page, activeCategory, activeTeam],
    queryFn: () =>
      fetchProductsPage({
        page,
        size: PAGE_SIZE,
        category: activeCategory === '전체' ? undefined : activeCategory,
        team: activeTeam === '전체' ? undefined : activeTeam,
      }),
  });

  const products = productPage?.content ?? [];
  const totalPages = productPage?.totalPages ?? 0;

  const { data: categoryNames = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const categoryTabs = useMemo(() => ['전체', ...categoryNames], [categoryNames]);

  const { data: teamNames = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });
  const teamTabs = useMemo(() => ['전체', ...teamNames], [teamNames]);

  useEffect(() => {
    const paramCategory = searchParams.get('category') || '전체';
    const paramTeam = searchParams.get('team') || '전체';
    setActiveCategory((current) => (current === paramCategory ? current : paramCategory));
    setActiveTeam((current) => (current === paramTeam ? current : paramTeam));
    setPage(0);
  }, [searchParams]);

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category);
    setPage(0);
  };

  const handleSelectTeam = (team: string) => {
    setActiveTeam(team);
    setPage(0);
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
      <AnnouncementBar message="⚾ 전 구단 굿즈 모음 · 신규 가입 시 15% 할인 쿠폰 증정 · 5만원 이상 구매 시 무료배송" />

      <SiteHeader />

      <AdBanner slides={AD_SLIDES} />

      <PerksBar perks={PERKS} />

      <p className={styles.filterLabel}>상품 종류</p>
      <CategoryTabs
        sectionId="products"
        categories={categoryTabs}
        active={activeCategory}
        onSelect={handleSelectCategory}
      />

      <p className={styles.filterLabel}>구단별</p>
      <CategoryTabs categories={teamTabs} active={activeTeam} onSelect={handleSelectTeam} />

      <section id="best" className={styles.products}>
        <h2>베스트 굿즈</h2>
        {isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : isError ? (
          <p className={styles.empty}>상품을 불러오지 못했습니다.</p>
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
          <p className={styles.empty}>해당 카테고리의 상품이 없습니다.</p>
        )}

        {!isLoading && !isError && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      </section>

      <SiteFooter />
    </div>
  );
};
