-- ============================================================
-- 005_profile_view_count.sql
-- 프로필 조회수 집계
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. profiles 테이블에 view_count 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;

-- 2. 원자적(atomic) 증가 RPC 함수
--    - 로그인 여부 무관하게 호출 가능 (SECURITY DEFINER)
--    - 본인 프로필 조회는 카운트하지 않음
CREATE OR REPLACE FUNCTION public.increment_profile_view(
  p_handle      TEXT,
  p_viewer_id   UUID DEFAULT NULL   -- 로그인 사용자 uid, 없으면 NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- handle 로 소유자 id 조회
  SELECT id INTO v_owner_id
  FROM public.profiles
  WHERE handle = p_handle
  LIMIT 1;

  -- 핸들 없으면 조용히 종료
  IF v_owner_id IS NULL THEN
    RETURN;
  END IF;

  -- 본인 방문이면 카운트 안 함
  IF p_viewer_id IS NOT NULL AND p_viewer_id = v_owner_id THEN
    RETURN;
  END IF;

  -- 원자적 증가
  UPDATE public.profiles
  SET view_count = view_count + 1
  WHERE id = v_owner_id;
END;
$$;

-- 3. 익명 사용자(anon)도 RPC 호출 가능하게 GRANT
GRANT EXECUTE ON FUNCTION public.increment_profile_view(TEXT, UUID)
  TO anon, authenticated;
