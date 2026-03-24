-- ================================================================
-- 002_source_type.sql
-- collections 테이블에 출처 태그 컬럼 추가
-- ================================================================

-- 1. source_type 컬럼 추가
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS source_type TEXT
    CHECK (source_type IN ('official', 'unknown'))
    DEFAULT NULL;

-- 2. 인덱스 (optional: 필터 쿼리 성능)
CREATE INDEX IF NOT EXISTS collections_source_type_idx
  ON public.collections (source_type)
  WHERE source_type IS NOT NULL;

-- 완료
