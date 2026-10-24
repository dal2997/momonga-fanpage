-- ============================================================
-- 007_security_hardening.sql
-- 보안 강화 (2026-10)
-- Supabase SQL Editor에서 한 번에 실행하세요. 여러 번 실행해도 안전합니다.
--
-- 1) profiles 권한 컬럼(is_admin / is_approved / is_banned 등)을
--    일반 유저가 직접 바꾸지 못하게 트리거로 차단
-- 2) admin_get_user_email / admin_list_approved_emails 에 관리자 검증 강제
-- 3) 가격 제안 알림용 offer_owner_email RPC 신설
--    (일반 유저가 admin RPC로 남의 이메일을 조회하던 경로 제거)
-- 4) increment_profile_view 에서 클라이언트가 넘긴 viewer_id 를 믿지 않도록 수정
-- ============================================================


-- ------------------------------------------------------------
-- 0. 관리자 판별 헬퍼
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;


-- ------------------------------------------------------------
-- 1. profiles 권한 컬럼 보호 트리거
--    - 앱(anon/authenticated 역할)에서 직접 바꾸는 경우만 검사
--    - SECURITY DEFINER 함수(redeem_profile 등)나 대시보드(postgres)는 통과
--    - 관리자는 통과
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF public.is_admin_user() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.is_admin, false)
       OR COALESCE(NEW.is_approved, false)
       OR COALESCE(NEW.is_banned, false) THEN
      RAISE EXCEPTION 'not allowed to set privileged profile columns';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.is_admin    IS DISTINCT FROM OLD.is_admin
     OR NEW.is_approved IS DISTINCT FROM OLD.is_approved
     OR NEW.is_banned   IS DISTINCT FROM OLD.is_banned
     OR NEW.view_count  IS DISTINCT FROM OLD.view_count THEN
    RAISE EXCEPTION 'not allowed to change privileged profile columns';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_privileged ON public.profiles;
CREATE TRIGGER profiles_protect_privileged
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();


-- ------------------------------------------------------------
-- 2. admin 이메일 RPC — 관리자 검증 강제
--    (기존 함수 본문을 덮어씁니다. 반환 타입이 다르면 DROP 후 재생성)
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_get_user_email(uuid);
CREATE FUNCTION public.admin_get_user_email(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_email(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_email(uuid) TO authenticated;


DROP FUNCTION IF EXISTS public.admin_list_approved_emails();
CREATE FUNCTION public.admin_list_approved_emails()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_list text[];
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  SELECT COALESCE(array_agg(u.email), ARRAY[]::text[]) INTO v_list
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_approved = true
    AND COALESCE(p.is_banned, false) = false
    AND u.email IS NOT NULL;

  RETURN v_list;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_approved_emails() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_approved_emails() TO authenticated;


-- ------------------------------------------------------------
-- 3. 가격 제안 알림용: "방금 내가 보낸 제안"의 소유자 이메일만 반환
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.offer_owner_email(p_offer_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT u.email INTO v_email
  FROM public.offers o
  JOIN auth.users u ON u.id = o.owner_id
  WHERE o.id = p_offer_id
    AND o.from_user_id = auth.uid()
    AND o.created_at > now() - interval '5 minutes';

  RETURN v_email;  -- 조건 안 맞으면 NULL
END;
$$;

REVOKE ALL ON FUNCTION public.offer_owner_email(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.offer_owner_email(uuid) TO authenticated;


-- ------------------------------------------------------------
-- 4. 조회수 RPC — viewer 는 auth.uid() 로만 판단
--    (기존 시그니처 유지: 앱 코드 수정 없이 동작, p_viewer_id 는 무시)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_profile_view(
  p_handle     TEXT,
  p_viewer_id  UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_viewer   UUID := auth.uid();
BEGIN
  IF p_handle IS NULL OR length(p_handle) > 64 THEN RETURN; END IF;

  SELECT id INTO v_owner_id
  FROM public.profiles
  WHERE handle = p_handle
  LIMIT 1;

  IF v_owner_id IS NULL THEN RETURN; END IF;
  IF v_viewer IS NOT NULL AND v_viewer = v_owner_id THEN RETURN; END IF;

  UPDATE public.profiles
  SET view_count = view_count + 1
  WHERE id = v_owner_id;

  INSERT INTO public.profile_views_daily (handle, date, count)
  VALUES (p_handle, CURRENT_DATE, 1)
  ON CONFLICT (handle, date)
  DO UPDATE SET count = public.profile_views_daily.count + 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_profile_view(TEXT, UUID)
  TO anon, authenticated;


-- ------------------------------------------------------------
-- 5. offers.message 길이 제한 (API 와 동일하게 500자)
-- ------------------------------------------------------------
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_message_len;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_message_len CHECK (message IS NULL OR char_length(message) <= 500);


-- ------------------------------------------------------------
-- 확인용 쿼리 (실행 후 결과만 보세요)
-- ------------------------------------------------------------
-- RLS 꺼진 public 테이블이 있으면 여기 나옵니다 → 0행이어야 정상
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
