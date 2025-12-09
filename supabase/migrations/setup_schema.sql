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

-- ============================================
-- Row Level Security (RLS) 설정
-- ============================================
-- 개발 단계에서는 RLS를 비활성화하여 개발 편의성 확보
-- 프로덕션에서는 반드시 활성화하여 보안 유지
-- ============================================

-- RLS 비활성화 (개발용 - 프로덕션에서는 ENABLE로 변경)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 개발용 임시 정책 (모든 인증된 사용자 접근 허용)
-- 프로덕션에서는 아래의 엄격한 정책들로 교체 필요
CREATE POLICY "Development: authenticated users can access all"
ON public.users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 관리자 권한으로 모든 작업 허용 (서비스 역할)
CREATE POLICY "Service role has full access"
ON public.users FOR ALL
TO service_role
USING (true);

-- ============================================
-- 프로덕션용 엄격한 RLS 정책들 (주석 처리)
-- 프로덕션 배포 시 위의 개발용 정책을 제거하고 아래 정책들 활성화
-- ============================================

/*
-- 프로덕션용: Clerk 사용자만 자신의 데이터 조회 가능
CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'));

-- 프로덕션용: Clerk 사용자만 자신의 데이터 수정 가능
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'))
WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

-- 프로덕션용: Clerk 사용자는 자신의 데이터 삽입 가능 (계정 생성 시)
CREATE POLICY "Users can insert own data"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

-- 프로덕션용: Clerk 사용자만 자신의 데이터 삭제 가능
CREATE POLICY "Users can delete own data"
ON public.users FOR DELETE
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'));
*/

-- 권한 부여
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
