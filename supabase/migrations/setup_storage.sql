-- Storage 버킷 생성 및 RLS 정책 설정
-- Clerk 인증된 사용자만 자신의 파일에 접근할 수 있도록 제한

-- 1. uploads 버킷 생성 (이미 존재하면 무시됨)
-- 게시물 이미지는 공개되어야 하므로 public으로 설정
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,  -- public bucket (게시물 이미지는 누구나 볼 수 있어야 함)
  5242880,  -- 5MB 제한 (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']  -- 이미지 파일만 허용
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- INSERT: 인증된 사용자만 자신의 폴더에 업로드 가능
-- 경로 형식: ${userId}/posts/${fileName}
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- 공개 읽기 정책 추가 (게시물 이미지는 누구나 볼 수 있어야 함)
-- posts 폴더 내의 파일만 공개 읽기 허용
CREATE POLICY "Public read access for post images"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[2] = 'posts'  -- 두 번째 폴더가 'posts'인 경우만
);

-- SELECT: 인증된 사용자만 자신의 파일 조회 가능
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- DELETE: 인증된 사용자만 자신의 파일 삭제 가능
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- UPDATE: 인증된 사용자만 자신의 파일 업데이트 가능
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);
