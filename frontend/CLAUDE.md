# CLAUDE.md (frontend/)

React 19/TypeScript(Vite) 프론트엔드. 루트 `CLAUDE.md`의 프로젝트 개요를 함께 참고.

## Commands

```
npm run dev        # 개발 서버 (Vite, :5173)
npm run build       # tsc -b (타입체크) && vite build
npm run lint         # eslint
npm run test         # vitest (watch 모드)
npm run test:run     # vitest run (1회 실행, CI/확인용)
npm run test:e2e     # playwright test (e2e, 아래 참고)
npm run test:e2e:ui  # playwright test --ui (디버깅용 UI 모드)
```

프론트 변경 후에는 최소 `npm run lint`와 `npm run build`(타입체크 포함)를 돌려서 확인한다. 테스트가 있는 로직(예: `Pagination` 등 순수 컴포넌트)을 고쳤다면 `npm run test:run`도 함께 확인한다.

테스트는 Vitest + `@testing-library/react`로 구성되어 있다(`vite.config.ts`의 `test` 필드, `src/setupTests.ts`). `test.globals`를 켜지 않았으므로 테스트 파일마다 `describe`/`it`/`expect`/`vi`를 `'vitest'`에서 명시적으로 import한다 — 이 저장소가 암묵적 전역보다 명시적 import를 선호하는 스타일과 맞춘 것. 새 테스트를 추가할 때도 이 패턴을 따를 것.

### e2e (Playwright)

`e2e/*.spec.ts`에 Playwright 테스트가 있다(`playwright.config.ts`). `webServer` 설정이 `npm run dev`(Vite, :5173)는 자동으로 띄워주지만, **백엔드는 자동으로 켜주지 않으므로** `npm run test:e2e` 실행 전에 `backend/`를 별도 터미널에서 `local` 프로파일로 미리 띄워둬야 한다(`backend/CLAUDE.md` 참고). 상품 목록 등 DB 데이터에 의존하는 테스트는 특정 상품명 대신 "첫 번째 카드" 같은 데이터 비의존적 선택자를 쓴다. 브라우저 바이너리가 없으면 `npx playwright install chromium`으로 받는다.

이 개발 환경(macOS)에도 시스템 PATH에 `node`/`npm`이 잡혀 있지 않다(`npm: command not found`). 실행 파일 자체는 Homebrew 위치에 있으므로, 프론트 관련 명령을 실행하기 전에 PATH에 추가한다:

```
export PATH="/opt/homebrew/bin:$PATH"
```

## Architecture

**프론트엔드 구조** (`frontend/src/`): `api/`(도메인별 axios 호출 모듈, 공용 `axiosInstance` 사용), `pages/`(`admin/`, `mypage/` 하위 라우팅 포함), `components/`, `hooks/`, `context/`, `types/`, `constants/`. 스타일은 CSS Modules.
