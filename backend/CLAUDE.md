# CLAUDE.md (backend/)

Spring Boot 4(Java 17) 백엔드. 루트 `CLAUDE.md`의 프로젝트 개요를 함께 참고.

## Commands

```
./mvnw spring-boot:run          # 로컬 실행 (spring.profiles.active=local)
./mvnw test                     # 전체 테스트
./mvnw test -Dtest=ClassName    # 단일 테스트 클래스
./mvnw clean package            # 빌드
```
`BackendApplicationTests`(컨텍스트 로드 확인) 외에 `Service` 패키지 클래스별로 JUnit 5 + Mockito 기반 유닛 테스트가 있다(`backend/src/test/java/lsy/toy/backend/Service/`) — Repository는 목(mock) 처리해 실제 DB 없이 소유권 검증, 금액/할인/적립금 계산, 상태 전이 같은 서비스 로직을 검증한다. 새 Service 메서드에 분기(권한, 금액 계산, 상태값 검증 등)가 생기면 같은 패턴(`@ExtendWith(MockitoExtension.class)`, `@Mock`/`@InjectMocks`, `ReflectionTestUtils`로 엔티티 id 주입)으로 테스트를 추가할 것. 그 외 화면 단위 기능 검증은 로컬 실행 후 데모 계정으로 수동 확인한다(README의 데모 계정 참고).

이 개발 환경(macOS)에는 시스템 JDK가 따로 설치되어 있지 않다(`java -version`이 "Unable to locate a Java Runtime"로 실패). 다만 VSCode의 `redhat.java` 확장이 언어 서버 구동용으로 완전한 JDK를 내장하고 있어, 그걸로 `./mvnw compile` 등 컴파일 확인이 가능하다:
```
JAVAC_PATH=$(find ~/.vscode/extensions -path "*redhat.java-*/jre/*/bin/javac" | head -1)
export JAVA_HOME=$(dirname "$(dirname "$JAVAC_PATH")")
export PATH="$JAVA_HOME/bin:$PATH"
```
(대입문에는 셸 glob이 확장되지 않으므로 `find`로 실제 경로를 구해서 대입해야 한다 — `.../jre/*`처럼 와일드카드를 바로 대입하면 문자 그대로 들어가 실패한다.)

백엔드 코드를 고친 뒤에는 위처럼 `JAVA_HOME`을 잡고 최소 `./mvnw compile`로 컴파일 여부를 확인할 것. Service 로직을 고쳤다면 `./mvnw test -Dtest=ClassNameTest`로 관련 유닛 테스트도 돌려서 확인한다 — Mockito로 Repository를 목 처리한 순수 유닛 테스트라 DB 없이 안전하게 실행된다. 다만 `BackendApplicationTests`를 포함한 전체 `./mvnw test`나 `spring-boot:run`은 Supabase 실제 DB에 붙으므로, 컨텍스트 로드나 DB 부수효과가 걱정되면 사용자에게 먼저 확인한다. redhat.java 확장 버전이 올라가면 폴더명이 바뀌므로 위 `find` 방식을 그대로 쓰면 된다.

## Architecture

**백엔드 패키지 구조** (`backend/src/main/java/lsy/toy/backend/`): `Controller` / `Service` / `Repository` / `Entity` / `Dto` / `Security` / `Config`로 나뉘고, 폴더명이 대문자로 시작한다(관례를 따를 것). Controller는 요청 검증과 라우팅만, 소유권 검사(본인 주문인지 등)와 비즈니스 로직은 Service 계층에서 처리하는 패턴을 따른다.

**인증/인가는 세 겹으로 걸려 있다** — 새 엔드포인트를 추가할 때 세 곳을 함께 맞춰야 한다:
1. `Security/SecurityConfig.java`의 `authorizeHttpRequests` — URL 패턴별 인증/권한 매처. 더 구체적인 규칙을 더 일반적인 규칙보다 먼저 선언해야 한다(예: `/api/orders/*/cancel`이 `/api/orders/**`보다 먼저 와야 본인 취소가 관리자 전용 규칙에 막히지 않음).
2. Service 계층의 소유권 재검증 (예: 결제 승인 시 요청자가 실제 주문 소유자인지).
3. DB의 Row Level Security 정책 (아래 참고). 이 세 곳 중 하나만 걸어두면 나머지 경로로 데이터가 샐 수 있다.

**DB 스키마는 Flyway가 전담한다** (`backend/src/main/resources/db/migration/V{n}__description.sql`). `spring.jpa.hibernate.ddl-auto=validate`라 엔티티만 고치고 마이그레이션을 안 만들면 기동 시점에 에러가 난다. 새 컬럼/테이블이 필요하면 반드시 다음 버전 번호로 `Vn__*.sql`을 추가할 것 — 기존 마이그레이션 파일은 수정하지 않는다(이미 적용된 히스토리와 어긋남).

**Row Level Security (V11 이후)**: 런타임 커넥션(`app_runtime`, `spring.datasource.*`)과 마이그레이션 소유자 커넥션(`spring.flyway.*`)이 분리되어 있다. 새 테이블을 추가하면 같은 마이그레이션(또는 후속 마이그레이션)에서 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`와 정책을 함께 추가해야 한다 — 그렇지 않으면 `app_runtime`은 소유자가 아니어도 기본적으로 그 테이블에 접근 가능해서 RLS 보호가 조용히 빠진다. 정책은 `app_current_user_id()` / `app_is_admin()` 헬퍼(V11에서 정의, `app.user_id`/`app.user_role` 세션 설정 기반)를 사용하는 기존 패턴(V11 파일 참고)을 따른다.

**N+1 방지**: 연관관계에 `fetch = FetchType.EAGER`를 쓴 필드가 하나라도 있으면(`Order.user`/`items`, `Product.category`/`team`, `CartItem`/`WishlistItem`/`RecentViewItem`의 `product` 등), 그 엔티티를 리스트로 조회하는 Repository 메서드는 파생 쿼리(메서드 이름 기반) 대신 `@Query` + `JOIN FETCH`(1:N은 `LEFT JOIN FETCH` + `DISTINCT`)로 직접 짤 것 — JPA는 EAGER 연관관계를 파생 쿼리에서 자동으로 조인해주지 않고 건별로 추가 SELECT를 날린다. 응답 DTO가 실제로 쓰지 않는 연관관계라도 EAGER면 무조건 로딩되므로 마찬가지로 fetch join이 필요하다. 새 연관관계를 추가하거나 리스트 조회 메서드를 추가할 때 이 패턴을 따르고, 기존 Repository의 💡 주석들(`OrderRepository`, `ProductRepository`, `ReviewRepository`, `QnaRepository`, `InquiryRepository`, `CartItemRepository`, `WishlistItemRepository`, `RecentViewItemRepository`)을 예시로 참고할 것.

**결제 연동**: 카카오페이/토스페이먼츠 모두 `pending payment` 테이블(`KakaoPendingPayment`/`TossPendingPayment`)에 준비(ready/prepare) 상태를 먼저 기록하고, PG 승인(approve/confirm)이 성공한 뒤에야 실제 주문(`Order`)을 생성한다. 승인은 됐는데 주문 생성이 실패하는 경우를 대비해 `status`/`retry_count`/`last_error`/`approved_at` 필드로 정합성 배치가 재시도 대상을 찾을 수 있게 되어 있다(V22). 이 흐름을 건드릴 때는 "승인 성공 → 주문 생성 실패" 케이스가 항상 복구 가능한 상태로 남는지 확인할 것.
