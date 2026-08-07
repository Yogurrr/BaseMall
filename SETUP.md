# 개발 환경 설정 (새 노트북으로 옮길 때)

이 저장소는 DB가 Supabase(클라우드 Postgres)라서 로컬에 DB를 새로 설치할 필요는 없다.
핵심은 **git에 올라가지 않는 설정 파일 2개**를 옮기는 것.

## 1. 저장소 클론

```
git clone https://github.com/Yogurrr/BaseMall.git
```

GitHub 인증(SSH 키 또는 `gh auth login`)이 새 노트북에 없다면 먼저 설정할 것.

## 2. 필수 툴 설치

- JDK 17 (Maven wrapper 포함이라 Maven 별도 설치 불필요)
- Node.js (LTS)

## 3. gitignore된 설정 파일 옮기기

아래 두 파일은 git에 안 올라가므로 **기존 노트북에서 직접 복사**하거나, 값을 잊었다면 Supabase 대시보드에서 다시 발급받아 `.example` 템플릿을 참고해 새로 채운다.

### `backend/src/main/resources/application-local.properties`

템플릿: [application-local.properties.example](backend/src/main/resources/application-local.properties.example)

필요한 값:
- `spring.datasource.*` — RLS 적용되는 제한 계정(`app_runtime`) 접속정보
- `spring.flyway.*` — 마이그레이션 실행용 소유자 계정 접속정보
- `jwt.secret` — HS256 서명 키 (32byte 이상)
- `supabase.storage.*` — Storage bucket, service-role key

### `frontend/.env`

템플릿: [frontend/.env.example](frontend/.env.example)

필요한 값:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 4. 실행 확인

```
# backend
cd backend
./mvnw spring-boot:run

# frontend
cd frontend
npm install
npm run dev
```

데모 계정(README 참고)으로 로그인해서 정상 동작하는지 확인.

## 5. (선택) Claude Code 설정/memory 이전

Claude Code의 memory와 로컬 설정은 저장소가 아니라 사용자 홈 디렉터리(`%USERPROFILE%\.claude`)에 저장된다.
저장소 클론만으로는 옮겨지지 않으므로, 필요하면 이 폴더를 통째로 새 노트북에 복사할 것.
