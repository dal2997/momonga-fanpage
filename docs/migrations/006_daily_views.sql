-- ============================================================
-- 006_daily_views.sql
-- 일별 프로필 방문자 집계 테이블
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. 일별 집계 테이블
CREATE TABLE IF NOT EXISTS public.profile_views_daily (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  handle     TEXT  NOT NULL,
  date       DATE  NOT NULL DEFAULT CURRENT_DATE,
  count      BIGINT NOT NULL DEFAULT 0,
  UNIQUE (handle, date)
);

CREATE INDEX IF NOT EXISTS pvd_date_idx    ON public.profile_views_daily (date DESC);
CREATE INDEX IF NOT EXISTS pvd_handle_idx  ON public.profile_views_daily (handle, date DESC);

-- RLS: 관리자만 직접 조회 가능 (API/RPC를 통해서만 접근)
ALTER TABLE public.profile_views_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pvd: admin read"
  ON public.profile_views_daily
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 2. increment_profile_view RPC 업데이트
--    - profiles.view_count 원자적 증가 (전체 누적)
--    - profile_views_daily upsert (일별 집계)
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
BEGIN
  SELECT id INTO v_owner_id
  FROM public.profiles
  WHERE handle = p_handle
  LIMIT 1;

  IF v_owner_id IS NULL THEN RETURN; END IF;
  IF p_viewer_id IS NOT NULL AND p_viewer_id = v_owner_id THEN RETURN; END IF;

  -- 전체 누적 카운터
  UPDATE public.profiles
  SET view_count = view_count + 1
  WHERE id = v_owner_id;

  -- 일별 집계 upsert
  INSERT INTO public.profile_views_daily (handle, date, count)
  VALUES (p_handle, CURRENT_DATE, 1)
  ON CONFLICT (handle, date)
  DO UPDATE SET count = profile_views_daily.count + 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_profile_view(TEXT, UUID)
  TO anon, authenticated;

-- 3. 오늘 전체 방문자 수 조회용 RPC (홈화면용)
CREATE OR REPLACE FUNCTION public.get_today_visit_count()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(count), 0)
  FROM public.profile_views_daily
  WHERE date = CURRENT_DATE;
$$;

GRANT EXECUTE ON FUNCTION public.get_today_visit_count()
  TO anon, authenticated;

-- 4. 최근 30일 일별 합산 조회용 RPC (관리자 통계용)
CREATE OR REPLACE FUNCTION public.get_daily_visits(p_days INT DEFAULT 30)
RETURNS TABLE(date DATE, total BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT date, SUM(count)::BIGINT AS total
  FROM public.profile_views_daily
  WHERE date >= CURRENT_DATE - (p_days - 1)
  GROUP BY date
  ORDER BY date ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_visits(INT)
  TO authenticated;
