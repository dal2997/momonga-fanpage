-- ============================================================
-- 001_invite_codes.sql
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. invite_codes 테이블
CREATE TABLE IF NOT EXISTS invite_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_to   uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- 특정 유저에게 발급 (선택)
  used_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz  -- NULL이면 만료 없음
);

-- RLS 활성화
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 행 조회/삽입/수정
CREATE POLICY "admin_all" ON invite_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 인덱스
CREATE INDEX IF NOT EXISTS invite_codes_code_idx ON invite_codes (code);
CREATE INDEX IF NOT EXISTS invite_codes_used_by_idx ON invite_codes (used_by);


-- 2. redeem_profile RPC
--    기존 함수가 다른 반환 타입으로 존재하면 먼저 DROP 후 재생성
--    - 코드 유효성 검증 (미사용 + 미만료)
--    - 사용 처리 (used_by, used_at)
--    - profiles.is_approved = true 업데이트
--    - profiles row가 없으면 upsert
DROP FUNCTION IF EXISTS public.redeem_profile(text);

CREATE OR REPLACE FUNCTION public.redeem_profile(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_row  invite_codes%ROWTYPE;
  v_uid       uuid := auth.uid();
BEGIN
  -- 로그인 확인
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', '로그인이 필요해.');
  END IF;

  -- 이미 승인된 유저면 바로 성공
  IF EXISTS (
    SELECT 1 FROM profiles WHERE id = v_uid AND is_approved = true
  ) THEN
    RETURN json_build_object('success', true, 'already_approved', true);
  END IF;

  -- 코드 조회 (미사용 + 미만료)
  SELECT * INTO v_code_row
  FROM invite_codes
  WHERE code = p_code
    AND used_by IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;  -- 동시 사용 방지

  IF v_code_row.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '유효하지 않거나 이미 사용된 코드야.');
  END IF;

  -- 코드 사용 처리
  UPDATE invite_codes
  SET used_by = v_uid, used_at = now()
  WHERE id = v_code_row.id;

  -- profiles upsert (row가 없는 경우 대비)
  INSERT INTO profiles (id, is_approved, approved_at)
  VALUES (v_uid, true, now())
  ON CONFLICT (id) DO UPDATE
  SET is_approved = true,
      approved_at = COALESCE(profiles.approved_at, now());

  RETURN json_build_object('success', true);
END;
$$;

-- redeem_profile은 로그인한 유저면 누구나 호출 가능
GRANT EXECUTE ON FUNCTION public.redeem_profile(text) TO authenticated;


-- 3. admin_issue_invite_code RPC (어드민 전용 코드 발급)
DROP FUNCTION IF EXISTS public.admin_issue_invite_code(uuid, int);

CREATE OR REPLACE FUNCTION public.admin_issue_invite_code(
  p_issued_to uuid DEFAULT NULL,
  p_expires_days int DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_uid uuid := auth.uid();
  v_code      text;
  v_expires   timestamptz;
BEGIN
  -- 어드민 확인
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_admin_uid AND is_admin = true
  ) THEN
    RETURN json_build_object('success', false, 'error', '관리자 권한이 필요해.');
  END IF;

  -- 코드 생성 (MOMONGA-XXXXXXXX 형식)
  v_code := 'MOMONGA-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- 만료일 계산
  IF p_expires_days IS NOT NULL THEN
    v_expires := now() + (p_expires_days || ' days')::interval;
  END IF;

  -- 삽입
  INSERT INTO invite_codes (code, created_by, issued_to, expires_at)
  VALUES (v_code, v_admin_uid, p_issued_to, v_expires);

  RETURN json_build_object('success', true, 'code', v_code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_issue_invite_code(uuid, int) TO authenticated;
