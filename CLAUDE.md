# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

KBO(한국프로야구) 굿즈 쇼핑몰. Spring Boot 4(Java 17) 백엔드 + React 19/TypeScript(Vite) 프론트엔드로 구성된 풀스택 토이 프로젝트. DB는 Supabase(클라우드 Postgres), Row Level Security로 접근을 제어한다.

백엔드 실행/테스트 명령과 아키텍처(패키지 구조, 인증/인가, Flyway, RLS, 결제 연동)는 `backend/CLAUDE.md`, 프론트엔드 실행/테스트 명령과 구조는 `frontend/CLAUDE.md` 참고.

## Local-only config

**로컬 전용 설정**은 git에 올라가지 않는다: `backend/src/main/resources/application-local.properties`(DB 두 계정 정보, JWT 시크릿, Supabase/카카오페이/토스페이먼츠 키)와 `frontend/.env`. 각각 `.example` 템플릿이 있다. 이 값들을 코드나 커밋에 하드코딩하지 않는다.

## Conventions

- 코드 주석은 "무엇"이 아니라 "왜"를 설명할 때만 남긴다. 이 저장소는 비직관적인 결정(권한 매처 순서, RLS 예외 등)에 `💡` 접두사를 붙인 한국어 주석으로 이유를 남기는 관례가 있다 — 새로 그런 결정을 추가할 때 같은 스타일을 따를 것.
- 커밋 메시지는 `type: 한국어 설명` 형식(`feat:`, `fix:`, `docs:`)을 따른다 (`git log` 참고).
- 사용자가 "지금까지 만든 거 깃허브에 올려줘" 류로 요청하면, 이는 "커밋하고 푸시하고 만든 내용을 README에 업데이트해달라"는 의미다. 커밋/푸시(원격 저장소에 영향을 주는 작업)와 README 수정을 함께 진행할 것.
