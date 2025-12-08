-- Users 테이블 생성
-- Clerk 인증과 연동되는 사용자 정보를 저장하는 테이블

CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.users OWNER TO postgres;

-- Row Level Security (RLS) 활성화
-- Clerk 인증된 사용자만 자신의 데이터에 접근할 수 있도록 제한
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Clerk 사용자만 자신의 데이터 조회 가능
CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'));

-- Clerk 사용자만 자신의 데이터 수정 가능
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'))
WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

-- Clerk 사용자는 자신의 데이터 삽입 가능 (계정 생성 시)
CREATE POLICY "Users can insert own data"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

-- 관리자 권한으로 모든 작업 허용 (서비스 역할)
CREATE POLICY "Service role has full access"
ON public.users FOR ALL
TO service_role
USING (true);

-- 권한 부여
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
