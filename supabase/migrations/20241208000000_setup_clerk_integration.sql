-- Clerk + Supabase 네이티브 통합을 위한 추가 설정
-- 2025년 권장 방식에 따른 RLS 정책 및 인덱스 최적화

-- 1. 기존 정책이 있다면 삭제 (재생성을 위해)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;

-- 2. RLS 활성화 확인
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Clerk 기반 RLS 정책 생성
-- SELECT: 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'));

-- UPDATE: 자신의 데이터만 수정 가능
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'))
WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

-- INSERT: 자신의 데이터만 삽입 가능 (계정 생성/동기화 시)
CREATE POLICY "Users can insert own data"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

-- DELETE: 자신의 데이터만 삭제 가능
CREATE POLICY "Users can delete own data"
ON public.users FOR DELETE
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'));

-- SERVICE ROLE: 관리자 권한으로 모든 작업 허용
CREATE POLICY "Service role has full access"
ON public.users FOR ALL
TO service_role
USING (true);

-- 4. 인덱스 최적화 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- 5. 예제 테이블 생성 (선택사항)
-- 실제 프로젝트에서 필요한 테이블들을 이곳에 추가하세요
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    clerk_id TEXT NOT NULL, -- Clerk 사용자 ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- posts 테이블 RLS 활성화 및 정책 설정
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all posts"
ON public.posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create own posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'))
WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'));

-- posts 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_clerk_id ON public.posts(clerk_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 권한 부여
GRANT ALL ON TABLE public.posts TO anon;
GRANT ALL ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.posts TO service_role;
