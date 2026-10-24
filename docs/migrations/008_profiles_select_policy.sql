-- ============================================================
-- 008_profiles_select_policy.sql
-- profiles 조회 범위 축소 (2026-10)
-- Supabase SQL Editor에서 실행하세요. 여러 번 실행해도 안전합니다.
--
-- 문제: 비로그인(anon)도 모든 프로필을 읽을 수 있었음
--   - 비공개(is_public=false) 프로필까지 노출
--   - is_admin / is_banned / ban_reason / approval_mail_sent_at 등 내부 컬럼 노출
--
-- 해결:
--   1) 행: 공개 프로필 + 본인 + 관리자 + 나와 제안(offer)을 주고받은 상대만 조회
--   2) 열: 비로그인에게는 내부 관리 컬럼 조회 권한 자체를 회수
-- ============================================================


-- ------------------------------------------------------------
-- 1. 기존 profiles SELECT 정책 전부 제거 후 하나로 통일
-- ------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd IN ('SELECT', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname);
    RAISE NOTICE 'dropped policy: %', pol.policyname;
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select visible"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true
    OR id = auth.uid()
    OR public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.offers o
      WHERE (o.owner_id = auth.uid() AND o.from_user_id = profiles.id)
         OR (o.from_user_id = auth.uid() AND o.owner_id = profiles.id)
    )
  );


-- ------------------------------------------------------------
-- 2. 위에서 'ALL' 정책을 지웠을 수 있으므로 쓰기 정책을 명시적으로 재생성
--    (본인 row만 INSERT/UPDATE. 권한 컬럼은 007 트리거가 막음)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;
CREATE POLICY "profiles: insert own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: update own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin_user())
  WITH CHECK (id = auth.uid() OR public.is_admin_user());


-- ------------------------------------------------------------
-- 3. 비로그인(anon)은 내부 관리 컬럼을 아예 못 읽게 컬럼 권한 회수
--    (공개 페이지에 필요한 컬럼만 허용)
-- ------------------------------------------------------------
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, handle, display_name, avatar_url, is_public, created_at,
  bio, view_count, min_offer_multiplier, shipping_method
) ON public.profiles TO anon;


-- ------------------------------------------------------------
-- 확인용: 정책 목록 (SELECT 정책이 "profiles: select visible" 하나여야 정상)
-- ------------------------------------------------------------
SELECT policyname, cmd, roles FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd;
