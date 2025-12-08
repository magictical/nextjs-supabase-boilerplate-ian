-- ============================================
-- Supabase Storage 버킷 설정
-- Instagram 클론용 게시물 이미지 저장소
-- ============================================

-- ============================================
-- 1. Posts 버킷 생성 (공개 읽기)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,  -- 공개 읽기 활성화 (게시물 이미지는 누구나 볼 수 있어야 함)
  5242880,  -- 5MB 제한 (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']  -- 이미지 파일만 허용
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================
-- 2. Storage 정책 설정
-- ============================================

-- 2.1 공개 읽기 정책 (모든 사용자가 게시물 이미지 조회 가능)
CREATE POLICY "Public read access for post images"
ON storage.objects FOR SELECT
TO public  -- 공개 읽기
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts'  -- posts 폴더 내 파일만
);

-- 2.2 인증된 사용자 업로드 정책 (로그인한 사용자만 이미지 업로드 가능)
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  -- 파일 크기 추가 검증 (5MB)
  LENGTH(encode(decode(encode(data, 'escape'), 'base64'), 'hex')) / 2 <= 5242880
);

-- 2.3 본인 게시물만 수정/삭제 가능
CREATE POLICY "Users can update own post images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  -- Clerk user ID로 소유권 검증 (파일명에 user ID 포함 가정)
  SPLIT_PART(name, '/', 2) = (SELECT auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts'
);

CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = 'posts' AND
  -- Clerk user ID로 소유권 검증
  SPLIT_PART(name, '/', 2) = (SELECT auth.jwt()->>'sub')
);

-- ============================================
-- 3. 추가 유틸리티 버킷들 (선택사항)
-- ============================================

-- 프로필 이미지 버킷 (작은 크기, 사각형)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- 공개 읽기
  1048576,  -- 1MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 아바타 공개 읽기 정책
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 아바타 업로드 정책 (본인만)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  SPLIT_PART(name, '/', 1) = 'avatars' AND
  SPLIT_PART(name, '/', 2) = (SELECT auth.jwt()->>'sub')
);

-- ============================================
-- 적용 방법
-- ============================================
/*
Supabase 대시보드에서 적용하는 방법:

1. Dashboard → Storage 접속
2. SQL Editor에서 위 SQL 실행
3. 또는 Storage 탭에서 수동으로 버킷 생성:
   - posts 버킷 생성
   - Public bucket으로 설정
   - Max file size: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
   - Policies 탭에서 위 정책들 추가

로컬 개발 시:
npx supabase db reset  # 전체 DB 리셋 및 마이그레이션 재적용
*/
