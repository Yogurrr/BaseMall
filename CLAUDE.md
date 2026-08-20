# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

KBO(한국프로야구) 굿즈 쇼핑몰. Spring Boot 4(Java 17) 백엔드 + React 19/TypeScript(Vite) 프론트엔드로 구성된 풀스택 토이 프로젝트. DB는 Supabase(클라우드 Postgres), Row Level Security로 접근을 제어한다.

## Commands

**Backend** (`backend/`)
```
./mvnw spring-boot:run          # 로컬 실행 (spring.profiles.active=local)
./mvnw test                     # 전체 테스트
./mvnw test -Dtest=ClassName    # 단일 테스트 클래스
./mvnw clean package            # 빌드
```
현재 `BackendApplicationTests`(컨텍스트 로드 확인) 외 비즈니스 로직 테스트는 없다. 기능 검증은 로컬 실행 후 데모 계정으로 수동 확인하는 것이 현재 이 저장소의 실질적인 검증 방법이다(README의 데모 계정 참고).

이 개발 환경(macOS)에는 시스템 JDK가 따로 설치되어 있지 않다(`java -version`이 "Unable to locate a Java Runtime"로 실패). 다만 VSCode의 `redhat.java` 확장이 언어 서버 구동용으로 완전한 JDK를 내장하고 있어, 그걸로 `./mvnw compile` 등 컴파일 확인이 가능하다:
```
JAVAC_PATH=$(find ~/.vscode/extensions -path "*redhat.java-*/jre/*/bin/javac" | head -1)
export JAVA_HOME=$(dirname "$(dirname "$JAVAC_PATH")")
export PATH="$JAVA_HOME/bin:$PATH"
```
(대입문에는 셸 glob이 확장되지 않으므로 `find`로 실제 경로를 구해서 대입해야 한다 — `.../jre/*`처럼 와일드카드를 바로 대입하면 문자 그대로 들어가 실패한다.)

백엔드 코드를 고친 뒤에는 위처럼 `JAVA_HOME`을 잡고 최소 `./mvnw compile`로 컴파일 여부를 확인할 것. (`./mvnw test`/`spring-boot:run`은 Supabase 실제 DB에 붙으므로, 컨텍스트 로드나 DB 부수효과가 걱정되면 사용자에게 먼저 확인한다.) redhat.java 확장 버전이 올라가면 폴더명이 바뀌므로 위 `find` 방식을 그대로 쓰면 된다.

**Frontend** (`frontend/`)
```
npm run dev        # 개발 서버 (Vite, :5173)
npm run build       # tsc -b (타입체크) && vite build
npm run lint         # eslint
```
프론트 변경 후에는 최소 `npm run lint`와 `npm run build`(타입체크 포함)를 돌려서 확인한다.

## Architecture

**백엔드 패키지 구조** (`backend/src/main/java/lsy/toy/backend/`): `Controller` / `Service` / `Repository` / `Entity` / `Dto` / `Security` / `Config`로 나뉘고, 폴더명이 대문자로 시작한다(관례를 따를 것). Controller는 요청 검증과 라우팅만, 소유권 검사(본인 주문인지 등)와 비즈니스 로직은 Service 계층에서 처리하는 패턴을 따른다.

**인증/인가는 세 겹으로 걸려 있다** — 새 엔드포인트를 추가할 때 세 곳을 함께 맞춰야 한다:
1. `Security/SecurityConfig.java`의 `authorizeHttpRequests` — URL 패턴별 인증/권한 매처. 더 구체적인 규칙을 더 일반적인 규칙보다 먼저 선언해야 한다(예: `/api/orders/*/cancel`이 `/api/orders/**`보다 먼저 와야 본인 취소가 관리자 전용 규칙에 막히지 않음).
2. Service 계층의 소유권 재검증 (예: 결제 승인 시 요청자가 실제 주문 소유자인지).
3. DB의 Row Level Security 정책 (아래 참고). 이 세 곳 중 하나만 걸어두면 나머지 경로로 데이터가 샐 수 있다.

**DB 스키마는 Flyway가 전담한다** (`backend/src/main/resources/db/migration/V{n}__description.sql`). `spring.jpa.hibernate.ddl-auto=validate`라 엔티티만 고치고 마이그레이션을 안 만들면 기동 시점에 에러가 난다. 새 컬럼/테이블이 필요하면 반드시 다음 버전 번호로 `Vn__*.sql`을 추가할 것 — 기존 마이그레이션 파일은 수정하지 않는다(이미 적용된 히스토리와 어긋남).

**Row Level Security (V11 이후)**: 런타임 커넥션(`app_runtime`, `spring.datasource.*`)과 마이그레이션 소유자 커넥션(`spring.flyway.*`)이 분리되어 있다. 새 테이블을 추가하면 같은 마이그레이션(또는 후속 마이그레이션)에서 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`와 정책을 함께 추가해야 한다 — 그렇지 않으면 `app_runtime`은 소유자가 아니어도 기본적으로 그 테이블에 접근 가능해서 RLS 보호가 조용히 빠진다. 정책은 `app_current_user_id()` / `app_is_admin()` 헬퍼(V11에서 정의, `app.user_id`/`app.user_role` 세션 설정 기반)를 사용하는 기존 패턴(V11 파일 참고)을 따른다.

**결제 연동**: 카카오페이/토스페이먼츠 모두 `pending payment` 테이블(`KakaoPendingPayment`/`TossPendingPayment`)에 준비(ready/prepare) 상태를 먼저 기록하고, PG 승인(approve/confirm)이 성공한 뒤에야 실제 주문(`Order`)을 생성한다. 승인은 됐는데 주문 생성이 실패하는 경우를 대비해 `status`/`retry_count`/`last_error`/`approved_at` 필드로 정합성 배치가 재시도 대상을 찾을 수 있게 되어 있다(V22). 이 흐름을 건드릴 때는 "승인 성공 → 주문 생성 실패" 케이스가 항상 복구 가능한 상태로 남는지 확인할 것.

**로컬 전용 설정**은 git에 올라가지 않는다: `backend/src/main/resources/application-local.properties`(DB 두 계정 정보, JWT 시크릿, Supabase/카카오페이/토스페이먼츠 키)와 `frontend/.env`. 각각 `.example` 템플릿이 있다. 이 값들을 코드나 커밋에 하드코딩하지 않는다.

**프론트엔드 구조** (`frontend/src/`): `api/`(도메인별 axios 호출 모듈, 공용 `axiosInstance` 사용), `pages/`(`admin/`, `mypage/` 하위 라우팅 포함), `components/`, `hooks/`, `context/`, `types/`, `constants/`. 스타일은 CSS Modules.

## Conventions

- 코드 주석은 "무엇"이 아니라 "왜"를 설명할 때만 남긴다. 이 저장소는 비직관적인 결정(권한 매처 순서, RLS 예외 등)에 `💡` 접두사를 붙인 한국어 주석으로 이유를 남기는 관례가 있다 — 새로 그런 결정을 추가할 때 같은 스타일을 따를 것.
- 커밋 메시지는 `type: 한국어 설명` 형식(`feat:`, `fix:`, `docs:`)을 따른다 (`git log` 참고).
- 사용자가 "지금까지 만든 거 깃허브에 올려줘" 류로 요청하면, 이는 "커밋하고 푸시하고 만든 내용을 README에 업데이트해달라"는 의미다. 커밋/푸시(원격 저장소에 영향을 주는 작업)와 README 수정을 함께 진행할 것.
