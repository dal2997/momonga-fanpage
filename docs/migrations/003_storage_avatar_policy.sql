-- ================================================================
-- 003_storage_avatar_policy.sql
-- momonga 버킷의 avatars/ 폴더 Storage RLS 정책 추가
-- ================================================================

-- 1. 본인 아바타 업로드 허용 (avatars/{user_id}.*)
CREATE POLICY "avatars: authenticated upload own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'momonga'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.filename(name) LIKE auth.uid()::text || '.%')
);

-- 2. 본인 아바타 덮어쓰기(upsert) 허용
CREATE POLICY "avatars: authenticated update own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'momonga'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.filename(name) LIKE auth.uid()::text || '.%')
);

-- 3. 아바타 공개 읽기 허용 (공개 프로필에서 보여야 하므로)
CREATE POLICY "avatars: public read"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'momonga'
  AND (storage.foldername(name))[1] = 'avatars'
);

-- ================================================================
-- 참고: momonga 버킷이 이미 public이라면 SELECT 정책은 불필요하지만
-- 명시적으로 추가해두는 것이 안전함
-- ================================================================
