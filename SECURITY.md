# 🔐 Momonga Security Review

> **이 문서는 보안 전문가 역할을 합니다.**
> 새 기능을 추가하거나 GitHub에 push하기 전, 아래 체크리스트를 반드시 통과해야 합니다.
> 모든 항목에 ✅를 채운 뒤에만 배포하세요.

---

## 📋 배포 전 필수 체크리스트

### 1. 환경 변수 (Vercel / .env)

| 항목 | 확인 내용 | 상태 |
|------|-----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL이 올바른가 | ☐ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon(공개) 키인가 — service_role 키가 절대 여기 들어가면 안 됨 | ☐ |
| `NEXT_PUBLIC_SITE_URL` | `https://momonga.app`으로 설정됐는가 (localhost 금지) | ☐ |
| `RESEND_API_KEY` | Vercel 환경 변수에 설정돼 있는가 | ☐ |
| `MAIL_FROM` | 발송 도메인이 Resend에서 인증된 도메인인가 | ☐ |
| `.env.local` | `.gitignore`에 포함돼 있는가 (커밋 금지) | ☐ |

> ⚠️ **절대 커밋하면 안 되는 것**: `service_role` 키, `RESEND_API_KEY`, 실제 이메일 주소

---

### 2. Supabase RLS (Row Level Security)

> Supabase 대시보드 → Table Editor → 각 테이블 → RLS 탭에서 확인

| 테이블 | 확인 내용 | 상태 |
|--------|-----------|------|
| `profiles` | RLS 활성화돼 있는가 | ☐ |
| `profiles` | 자신의 row만 UPDATE 가능한가 (`auth.uid() = id`) | ☐ |
| `profiles` | `is_admin`, `is_approved`, `is_banned` 컬럼을 유저가 직접 수정 불가한가 | ☐ |
| `collections` | RLS 활성화돼 있는가 | ☐ |
| `collections` | `owner_id = auth.uid()`인 row만 INSERT/UPDATE/DELETE 가능한가 | ☐ |
| `collections` | 공개 프로필의 데이터는 anon이 SELECT 가능한가 | ☐ |

---

### 3. Admin RPC 보안

> Supabase 대시보드 → Database → Functions에서 확인

| RPC | 확인 내용 | 상태 |
|-----|-----------|------|
| `admin_get_user_email` | `SECURITY DEFINER`인가, 호출자가 `is_admin = true`인지 내부에서 검증하는가 | ☐ |
| `admin_list_approved_emails` | `SECURITY DEFINER`인가, 호출자가 `is_admin = true`인지 내부에서 검증하는가 | ☐ |
| 기타 admin RPC | anon이 직접 호출할 수 없도록 권한이 제한돼 있는가 | ☐ |

> ⚠️ **주의**: Admin API route에서 anon 키를 사용하므로, RPC 함수 자체에서 `is_admin` 검증이 없으면 누구나 호출 가능합니다.

---

### 4. API Route 인증/인가

> `src/app/api/` 하위 모든 route 파일 점검

| 항목 | 확인 내용 | 상태 |
|------|-----------|------|
| 세션 체크 | 모든 protected route에서 `supabase.auth.getUser()` 후 `!u.user` 처리하는가 | ☐ |
| Admin 체크 | `/api/admin/*` 라우트에서 `is_admin` 검증 후 진행하는가 | ☐ |
| 입력값 검증 | `action`, `userId` 등 body 파라미터에 대해 whitelist 방식으로 검증하는가 | ☐ |
| 에러 메시지 | 내부 DB 에러 메시지가 클라이언트에 그대로 노출되지 않는가 | ☐ |

---

### 5. Storage (이미지 업로드)

| 항목 | 확인 내용 | 상태 |
|------|-----------|------|
| 버킷 정책 | `momonga` 버킷에 anon의 무제한 업로드가 막혀 있는가 | ☐ |
| 경로 구조 | `{folder}/{user_id}/...` 패턴으로 다른 유저 경로에 덮어쓰기 불가한가 | ☐ |
| 파일 크기 | 5MB 제한이 서버/버킷 양쪽에서 걸려 있는가 | ☐ |
| MIME 타입 | 이미지 파일만 허용하는가 (`.js`, `.html` 등 업로드 불가) | ☐ |
| 삭제 권한 | `canDeletePublicUrlAsOwner()`가 올바르게 동작하는가 | ☐ |

---

### 6. 클라이언트 사이드 보안

| 항목 | 확인 내용 | 상태 |
|------|-----------|------|
| XSS | 사용자 입력이 `dangerouslySetInnerHTML`로 렌더링되는 곳이 없는가 | ☐ |
| 이메일 공지 HTML | `notice/route.ts`에서 `<`, `>` 이스케이프 처리가 돼 있는가 | ☐ |
| 외부 링크 | `target="_blank"` 사용 시 `rel="noopener noreferrer"`가 있는가 | ☐ |
| 콘솔 로그 | 민감한 정보(이메일, UUID, 토큰)가 `console.log`로 출력되지 않는가 | ☐ |

---

### 7. 새 기능 추가 시 추가 점검

새 기능을 배포하기 전, 해당되는 항목을 추가로 점검하세요.

#### 새 DB 테이블/컬럼 추가 시
- [ ] RLS 정책이 새 테이블에도 설정됐는가
- [ ] 민감한 컬럼(이메일, 가격, 메모 등)이 is_public 체크 없이 노출되지 않는가
- [ ] admin 전용 컬럼(`is_admin`, `is_approved` 등)을 유저가 직접 쓸 수 없는가

#### 새 API Route 추가 시
- [ ] `makeSupabase()` + `getUser()` 인증 흐름을 따르는가 (`src/lib/adminUtils.ts` 참고)
- [ ] admin route라면 `is_admin` 체크가 서버에서 이루어지는가
- [ ] catch 블록에서 `e: unknown` → `instanceof Error` 패턴으로 처리하는가 (`any` 금지)

#### 이메일 발송 기능 추가 시
- [ ] HTML 이메일 본문에 사용자 입력이 들어간다면 이스케이프 처리했는가
- [ ] 발송 대상 이메일 주소가 DB에서 검증된 유저 것인가
- [ ] `RESEND_API_KEY`, `MAIL_FROM` null 체크가 있는가

#### 파일 업로드 기능 추가 시
- [ ] 파일 타입/크기 제한이 있는가
- [ ] 업로드 경로에 `user_id`가 포함돼 있어 격리되는가
- [ ] 업로드 전 로그인 여부를 서버에서 확인하는가

---

### 8. Git Push 직전 최종 확인

```bash
# 커밋에 민감한 파일이 포함됐는지 확인
git diff --cached --name-only

# .env 파일이 스테이징됐는지 확인 (나오면 안 됨)
git diff --cached --name-only | grep -i "\.env"

# service_role 키워드가 코드에 있는지 확인 (나오면 안 됨)
grep -r "service_role" src/
```

| 항목 | 확인 내용 | 상태 |
|------|-----------|------|
| `.env.local` | 커밋에 포함 안 됐는가 | ☐ |
| `service_role` 키 | 소스코드 어디에도 없는가 | ☐ |
| TODO 주석 | 미구현 기능(501 반환)이 있다면 인지하고 있는가 | ☐ |
| TypeScript | `any` 타입이 새로 추가되지 않았는가 | ☐ |
| 죽은 코드 | 사용하지 않는 함수/import가 없는가 | ☐ |

---

## 🗂️ 현재 알려진 미구현 항목 (TODO)

| 위치 | 내용 | 우선순위 |
|------|------|----------|
| `approval/route.ts` | `action: "issue"` — invite_codes 테이블 스키마 확정 후 구현 필요 | 높음 |
| `approval/route.ts` | `action: "send"` — invite_codes에서 코드 조회 후 메일 발송 구현 필요 | 높음 |
| Vercel 환경 변수 | `NEXT_PUBLIC_SITE_URL=https://momonga.app` 설정 확인 필요 | 높음 |
| Supabase RPC | `admin_get_user_email`, `admin_list_approved_emails`의 내부 `is_admin` 검증 확인 필요 | 높음 |
| Storage 버킷 | MIME 타입 제한 정책 Supabase 대시보드에서 확인 필요 | 중간 |

---

## 📌 보안 원칙 요약

1. **클라이언트를 절대 믿지 마라** — 모든 권한 체크는 서버(API route 또는 RPC)에서.
2. **RLS가 마지막 방어선** — API route가 뚫려도 RLS가 막아야 한다.
3. **anon 키 ≠ 안전** — anon 키는 공개되지만, RLS/RPC 정책이 없으면 DB가 열린다.
4. **`any`는 보안 구멍** — TypeScript `any`는 입력 검증을 무력화할 수 있다.
5. **환경 변수는 코드가 아니다** — secret은 절대 소스코드에 하드코딩하지 않는다.

---

*최종 업데이트: 2026-03-22*
*관리: 이 파일은 새 기능 추가 또는 보안 이슈 발견 시 업데이트하세요.*
