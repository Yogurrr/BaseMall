# ⚾ KBO 굿즈 쇼핑몰

KBO(한국프로야구) 구단 굿즈를 사고파는 온라인 쇼핑몰입니다. Spring Boot 백엔드와 React 프론트엔드로 구성된 풀스택 토이 프로젝트입니다.

## 주요 기능

- 회원가입 / 로그인 (JWT 기반 인증), 회원 탈퇴
- 마이페이지에서 응원 구단 선택
- 구단 · 카테고리별 상품 필터링, 상품 검색
- 장바구니 및 주문
- 관리자 페이지: 상품 관리, 회원 관리, 주문 상태 관리(상태별 필터)
- 라이트 / 다크 테마 지원

## 기술 스택

**Backend**
- Java 17, Spring Boot 4
- Spring Security (JWT 인증), Spring Data JPA
- PostgreSQL (Supabase)

**Frontend**
- React 19, TypeScript, Vite
- React Router, TanStack Query, Axios
- CSS Modules

## 화면

| 홈 | 상품 목록 |
| --- | --- |
| ![홈 배너](docs/screenshots/home.png) | ![상품 목록](docs/screenshots/home-grid.png) |

| 상품 검색 | 장바구니 |
| --- | --- |
| ![상품 검색](docs/screenshots/search.png) | ![장바구니](docs/screenshots/cart.png) |

| 마이페이지 (응원팀 선택) | 관리자 - 상품 관리 |
| --- | --- |
| ![마이페이지](docs/screenshots/mypage.png) | ![관리자 상품 관리](docs/screenshots/admin.png) |

### 데모 계정

| 이메일 | 비밀번호 | 권한 |
| --- | --- | --- |
| kim@example.com | password123 | ADMIN |
| lee@example.com | password123 | USER |
| park@example.com | password123 | USER |
