# momonga.app — 출시 로드맵

> 마지막 검토: 2026-03-24

---

## 🔴 Critical — 출시 전 필수 (Blockers)

### ✅ 1. `SERVICE_PAUSED` 플래그 제거
- **파일:** `src/app/login/LoginClient.tsx`
- 플래그 제거, 로그인 페이지 전면 재작성 완료

### ✅ 2. 프로덕션 환경변수 설정
- **파일:** `.env.local`, Vercel 환경변수
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_OWNER_HANDLE` → `.env.local` 완료
- ⚠️ Vercel 대시보드에 아래 변수 설정 필요:
  - `NEXT_PUBLIC_SITE_URL=https://momonga.app`
  - `NEXT_PUBLIC_OWNER_HANDLE=dal2997`
  - `RESEND_API_KEY=<키>`
  - `MAIL_FROM=<발신 이메일>`

### ✅ 3. 초대코드 시스템 완성
- `invite_codes` 테이블, `redeem_profile()` RPC, `admin_issue_invite_code()` RPC 완료
- `docs/migrations/001_invite_codes.sql` Supabase에서 실행 완료
- Admin UI에 "코드 발급(복사)" / "메일 발송" 버튼 완료
- `/redeem` 페이지 완료

---

## 🟠 High Priority — 베타 품질

### ✅ 4. 서버사이드 오퍼 자기 차단
- DB에서 `owner_id` 실제 조회 후 동일인 차단 로직 완료

### ✅ 5. 오퍼 이메일 레이트 리밋
- 24시간 내 동일 `(collection_id, from_user_id)` 3회 초과 차단 완료

### ✅ 6. 프로필 아바타 업로드 UI
- 편집 모드에 이미지 업로드 + Storage 연동 완료

### ✅ 7. 로그아웃 피드백 개선
- 로그아웃 후 `window.location.href = "/"` 리다이렉트 완료

### 8. 캐릭터 이미지 추가
- **파일:** `src/data/characters.ts`, `/public/images/`
- 각 캐릭터별 `/public/images/{id}/01.png` ~ `04.png` 필요
- 실제 이미지 파일은 별도 작업 필요

---

## 🟡 Medium — 완성도 향상

### ✅ 9. 거래 완료 흐름
- `offers.status`: `pending` / `accepted` / `rejected` / `completed` 완료
- `/my/offers` 수락/거절/완료 버튼 완료
- API `PATCH /api/offers/[id]` 완료

### ✅ 10. 인앱 알림 뱃지
- TopTabs에 미읽음 오퍼 수 뱃지 (30초 폴링) 완료

### ✅ 11. 하드코딩된 PUBLIC_HANDLE 개선
- `src/lib/config.ts` → `NEXT_PUBLIC_OWNER_HANDLE` 환경변수 완료

### 12. 브라우즈 페이지 로딩 스켈레톤
- `src/app/browse/loading.tsx` skeleton UI 추가 예정

---

## 🟢 Nice-to-have — 향후 기능

### 13. 아이템 단위 탐색 / 검색
- 지금은 유저 카드 단위 탐색 → 특정 굿즈명으로 검색 기능
- 태그 / 캐릭터별 필터

### 14. 수집 통계 심화
- 월별 지출 추이, 카테고리별 분포 차트
- 총 수집 가치 vs 중고 시세 비교

### 15. 위시리스트 / 수집 예정
- 현재 `collecting` / `collected` 외에 `wishlist` 상태 추가
- 다른 유저 위시리스트 보고 선물/오퍼 가능

### 16. 모바일 최적화
- Collection 모달, 빠른추가 UI 등 모바일 실기기 검증
- Bottom sheet 패턴으로 모달 개선

### 17. OG 이미지 / 소셜 공유
- `/u/[handle]` 페이지 공유 시 수집품 이미지가 썸네일로 나오도록
- `next/og` 활용한 동적 OG 이미지 생성

---

## ✅ 완료된 것들

- [x] 수집/수집완료 CRUD (카테고리, 드래그 정렬, 이미지 업로드)
- [x] 공개 프로필 페이지 (`/u/[handle]`)
- [x] 탐색 페이지 (유저 카드 + 오퍼 모달)
- [x] 오퍼 시스템 (최소금액, 배송방식, 판매가 표시)
- [x] 판매 희망가 (`sale_price`) 설정
- [x] 자기 자신에게 오퍼 클라이언트 + 서버 차단
- [x] 라이트/다크 모드 완전 지원
- [x] 수집 탭 공개 요약 카드
- [x] 어드민 대시보드 (승인/밴/공지/코드발급/메일발송)
- [x] 법적 고지 페이지 (약관, 개인정보, 팬사이트 고지)
- [x] SERVICE_PAUSED 제거 + 로그인 UI 재작성
- [x] 환경변수화 (SITE_URL, OWNER_HANDLE)
- [x] 초대코드 시스템 (DB + RPC + API + UI + /redeem)
- [x] 서버사이드 오퍼 검증 (DB owner 확인 + 레이트리밋)
- [x] 오퍼 수락/거절/거래완료 흐름
- [x] 인앱 알림 뱃지 (30초 폴링)
- [x] 프로필 아바타 업로드 UI
