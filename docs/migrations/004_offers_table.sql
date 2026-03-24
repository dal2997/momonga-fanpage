-- ============================================================
-- 004_offers_table.sql
-- offers (가격 제안) 테이블 생성
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.offers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id  UUID        NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  owner_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount         INTEGER     NOT NULL CHECK (amount > 0 AND amount <= 100000000),
  message        TEXT        DEFAULT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 인덱스 ───────────────────────────────────────────────────
-- 내 수집품에 들어온 제안 목록 (my/offers 페이지)
CREATE INDEX IF NOT EXISTS offers_owner_id_idx
  ON public.offers (owner_id, created_at DESC);

-- 내가 보낸 제안 목록
CREATE INDEX IF NOT EXISTS offers_from_user_id_idx
  ON public.offers (from_user_id, created_at DESC);

-- 수집품별 제안 (레이트 리밋 체크)
CREATE INDEX IF NOT EXISTS offers_collection_id_idx
  ON public.offers (collection_id);

-- ── updated_at 자동 갱신 트리거 ──────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS offers_updated_at ON public.offers;
CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS (Row Level Security) ─────────────────────────────────
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 1. 제안 넣기: 로그인한 사용자 누구나 (자기 자신 제외는 API에서 처리)
CREATE POLICY "offers: insert authenticated"
  ON public.offers
  FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

-- 2. 조회: 수집품 소유자(받은 제안) 또는 제안 보낸 사람(내가 보낸 제안)
CREATE POLICY "offers: select own"
  ON public.offers
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR from_user_id = auth.uid());

-- 3. 상태 업데이트: 수집품 소유자만
CREATE POLICY "offers: update owner"
  ON public.offers
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 4. 삭제: 제안 보낸 사람 또는 소유자 (pending 상태에서만 — API에서 추가 검증)
CREATE POLICY "offers: delete own"
  ON public.offers
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() OR from_user_id = auth.uid());

-- ── profiles FK 별칭 (from_profile join 지원) ────────────────
-- Supabase 관계 조회를 위해 profiles 테이블에 FK 이름을 명시합니다.
-- 아래 constraint 이름이 코드의 !offers_from_user_id_fkey 와 일치해야 합니다.
-- (이미 위에서 REFERENCES auth.users 로 FK가 생성됐으므로,
--  profiles 뷰를 통한 join은 아래처럼 별도 FK를 추가합니다.)

-- profiles 테이블에 user_id가 있다고 가정합니다.
-- (없으면 아래 두 줄을 건너뛰세요.)
ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_from_user_id_fkey;

ALTER TABLE public.offers
  ADD CONSTRAINT offers_from_user_id_fkey
  FOREIGN KEY (from_user_id)
  REFERENCES public.profiles(id)   -- profiles.id = auth.users.id 여야 함
  ON DELETE CASCADE;
