import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCart } from '../../hooks/useCart';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import {
  clearToken,
  isLoggedIn,
  subscribeAuthChange,
} from '../../api/authToken';
import { logout } from '../../api/authApi';
import { fetchCategories, fetchTeams } from '../../api/productApi';
import { SearchBar } from '../SearchBar/SearchBar';
import styles from './SiteHeader.module.css';

export const SiteHeader = () => {
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const { data: currentUser } = useCurrentUser();
  const isAdmin = loggedIn && currentUser?.role === 'ADMIN';

  useEffect(() => subscribeAuthChange(() => setLoggedIn(isLoggedIn())), []);

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const { data: categoryNames = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const teamMenuRef = useRef<HTMLDivElement>(null);
  const { data: teamNames = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  useEffect(() => {
    if (!categoryMenuOpen && !teamMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setCategoryMenuOpen(false);
      }
      if (
        teamMenuRef.current &&
        !teamMenuRef.current.contains(event.target as Node)
      ) {
        setTeamMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryMenuOpen, teamMenuOpen]);

  const buildFilterUrl = (key: 'category' | 'team', value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === '전체') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    return `/?${params.toString()}#products`;
  };

  const handleSelectCategory = (category: string) => {
    setCategoryMenuOpen(false);
    navigate(buildFilterUrl('category', category));
  };

  const handleSelectTeam = (team: string) => {
    setTeamMenuOpen(false);
    navigate(buildFilterUrl('team', team));
  };

  const handleSearch = (keyword: string) => {
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const handleLogout = () => {
    // 💡 서버쪽 리프레시 토큰도 폐기해야 새로고침 시 조용히 재로그인되는 걸 막을 수 있다.
    // 서버 호출이 실패해도(네트워크 오류 등) 클라이언트 로그아웃은 항상 완료돼야 하므로 결과와 무관하게 정리한다.
    logout().finally(() => {
      clearToken();
      queryClient.removeQueries({ queryKey: ['me'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
      queryClient.removeQueries({ queryKey: ['wishlist'] });
      navigate('/');
    });
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.brandNav}>
          <Link to="/" className={styles.logo}>
            ⚾ KBO 굿즈
          </Link>
          <nav className={styles.nav}>
            <a href="#best">베스트</a>
            <a href="#products">신상품</a>
            <div className={styles.categoryMenu} ref={categoryMenuRef}>
              <button
                type="button"
                className={styles.categoryTrigger}
                aria-expanded={categoryMenuOpen}
                onClick={() => setCategoryMenuOpen((open) => !open)}
              >
                카테고리 {categoryMenuOpen ? '▲' : '▼'}
              </button>
              {categoryMenuOpen && (
                <div className={styles.categoryDropdown}>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('전체')}
                  >
                    전체
                  </button>
                  {categoryNames.map((category) => (
                    <button
                      type="button"
                      key={category}
                      onClick={() => handleSelectCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.categoryMenu} ref={teamMenuRef}>
              <button
                type="button"
                className={styles.categoryTrigger}
                aria-expanded={teamMenuOpen}
                onClick={() => setTeamMenuOpen((open) => !open)}
              >
                구단 {teamMenuOpen ? '▲' : '▼'}
              </button>
              {teamMenuOpen && (
                <div className={styles.categoryDropdown}>
                  <button
                    type="button"
                    onClick={() => handleSelectTeam('전체')}
                  >
                    전체
                  </button>
                  {teamNames.map((team) => (
                    <button
                      type="button"
                      key={team}
                      onClick={() => handleSelectTeam(team)}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
        <div className={styles.searchWrap}>
          <SearchBar size="lg" onSearch={handleSearch} />
        </div>
        <div className={styles.headerActions}>
          {!isAdmin && (
            <Link
              to="/cart"
              className={styles.cartButton}
              aria-label="장바구니"
            >
              🛒
              {totalCount > 0 && (
                <span className={styles.cartBadge}>{totalCount}</span>
              )}
            </Link>
          )}
          {loggedIn ? (
            <>
              <Link
                to={isAdmin ? '/admin' : '/mypage'}
                className={styles.authButton}
              >
                {isAdmin ? '관리자 페이지' : '마이페이지'}
              </Link>
              <button
                type="button"
                className={styles.authButton}
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.authButton}>
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
