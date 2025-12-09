-- ============================================
-- Initial Setup: Instagram Clone SNS Database
-- ============================================
-- 1. Users 테이블
-- 2. Posts, Likes, Comments, Follows 테이블
-- 3. Views 및 Triggers
-- ============================================
-- Note: Storage 버킷은 Supabase 대시보드에서 직접 생성
-- ============================================

-- ============================================
-- 1. Users 테이블 생성
-- ============================================
-- Clerk 인증과 연동되는 사용자 정보를 저장하는 테이블
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.users OWNER TO postgres;

-- Row Level Security (RLS) 비활성화 (개발 단계)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- ============================================
-- 2. Posts 테이블 (게시물)
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,  -- Supabase Storage URL
    caption TEXT,  -- 최대 2,200자 (애플리케이션에서 검증)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.posts OWNER TO postgres;

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

-- Posts 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- RLS 최적화를 위한 복합 인덱스 (프로덕션용)
-- CREATE INDEX IF NOT EXISTS idx_posts_user_clerk_lookup ON public.posts(user_id)
-- WHERE user_id IN (SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub'));

-- ============================================
-- Row Level Security (RLS) 설정 - Posts
-- ============================================

-- RLS 비활성화 (개발용 - 프로덕션에서는 ENABLE로 변경)
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;

-- 개발용 임시 정책 (모든 인증된 사용자 접근 허용)
CREATE POLICY "Development: authenticated users can access posts"
ON public.posts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 관리자 권한으로 모든 작업 허용 (서비스 역할)
CREATE POLICY "Service role has full access to posts"
ON public.posts FOR ALL
TO service_role
USING (true);

-- ============================================
-- 프로덕션용 엄격한 RLS 정책들 (주석 처리)
-- ============================================

/*
-- 프로덕션용: 모든 인증된 사용자가 게시물 조회 가능 (타임라인용)
CREATE POLICY "Authenticated users can view all posts"
ON public.posts FOR SELECT
TO authenticated
USING (true);

-- 프로덕션용: 사용자는 자신의 게시물만 생성 가능
CREATE POLICY "Users can create own posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 프로덕션용: 사용자는 자신의 게시물만 수정 가능
CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 프로덕션용: 사용자는 자신의 게시물만 삭제 가능
CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);
*/

-- 권한 부여
GRANT ALL ON TABLE public.posts TO anon;
GRANT ALL ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.posts TO service_role;

-- ============================================
-- 3. Likes 테이블 (좋아요)
-- ============================================
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    -- 중복 좋아요 방지 (같은 사용자가 같은 게시물에 여러 번 좋아요 불가)
    UNIQUE(post_id, user_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.likes OWNER TO postgres;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

-- ============================================
-- Row Level Security (RLS) 설정 - Likes
-- ============================================

-- RLS 비활성화 (개발용)
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;

-- 개발용 임시 정책
CREATE POLICY "Development: authenticated users can access likes"
ON public.likes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 서비스 역할 정책
CREATE POLICY "Service role has full access to likes"
ON public.likes FOR ALL
TO service_role
USING (true);

-- ============================================
-- 프로덕션용 엄격한 RLS 정책들 (주석 처리)
-- ============================================

/*
-- 프로덕션용: 인증된 사용자는 모든 좋아요 조회 가능
CREATE POLICY "Authenticated users can view all likes"
ON public.likes FOR SELECT
TO authenticated
USING (true);

-- 프로덕션용: 사용자는 자신의 좋아요만 생성/삭제 가능
CREATE POLICY "Users can manage own likes"
ON public.likes FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);
*/

-- 권한 부여
GRANT ALL ON TABLE public.likes TO anon;
GRANT ALL ON TABLE public.likes TO authenticated;
GRANT ALL ON TABLE public.likes TO service_role;

-- ============================================
-- 4. Comments 테이블 (댓글)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.comments OWNER TO postgres;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- ============================================
-- Row Level Security (RLS) 설정 - Comments
-- ============================================

-- RLS 비활성화 (개발용)
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;

-- 개발용 임시 정책
CREATE POLICY "Development: authenticated users can access comments"
ON public.comments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 서비스 역할 정책
CREATE POLICY "Service role has full access to comments"
ON public.comments FOR ALL
TO service_role
USING (true);

-- ============================================
-- 프로덕션용 엄격한 RLS 정책들 (주석 처리)
-- ============================================

/*
-- 프로덕션용: 인증된 사용자는 모든 댓글 조회 가능
CREATE POLICY "Authenticated users can view all comments"
ON public.comments FOR SELECT
TO authenticated
USING (true);

-- 프로덕션용: 사용자는 자신의 댓글만 생성/수정/삭제 가능
CREATE POLICY "Users can manage own comments"
ON public.comments FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);
*/

-- 권한 부여
GRANT ALL ON TABLE public.comments TO anon;
GRANT ALL ON TABLE public.comments TO authenticated;
GRANT ALL ON TABLE public.comments TO service_role;

-- ============================================
-- 5. Follows 테이블 (팔로우)
-- ============================================
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,  -- 팔로우하는 사람
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,  -- 팔로우받는 사람
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    -- 중복 팔로우 방지 및 자기 자신 팔로우 방지
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.follows OWNER TO postgres;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);

-- ============================================
-- Row Level Security (RLS) 설정 - Follows
-- ============================================

-- RLS 비활성화 (개발용)
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;

-- 개발용 임시 정책
CREATE POLICY "Development: authenticated users can access follows"
ON public.follows FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 서비스 역할 정책
CREATE POLICY "Service role has full access to follows"
ON public.follows FOR ALL
TO service_role
USING (true);

-- ============================================
-- 프로덕션용 엄격한 RLS 정책들 (주석 처리)
-- ============================================

/*
-- 프로덕션용: 인증된 사용자는 모든 팔로우 관계 조회 가능
CREATE POLICY "Authenticated users can view all follows"
ON public.follows FOR SELECT
TO authenticated
USING (true);

-- 프로덕션용: 사용자는 자신의 팔로우 관계만 관리 가능
CREATE POLICY "Users can manage own follows"
ON public.follows FOR ALL
TO authenticated
USING (
  follower_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  follower_id IN (
    SELECT id FROM public.users
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);
*/

-- 권한 부여
GRANT ALL ON TABLE public.follows TO anon;
GRANT ALL ON TABLE public.follows TO authenticated;
GRANT ALL ON TABLE public.follows TO service_role;

-- ============================================
-- 6. 유용한 뷰 (Views)
-- ============================================

-- 게시물 통계 뷰 (좋아요 수, 댓글 수)
-- security_invoker = true로 설정하여 호출자의 권한으로 RLS 적용
CREATE OR REPLACE VIEW public.post_stats
WITH (security_invoker = true)
AS
SELECT
    p.id as post_id,
    p.user_id,
    p.image_url,
    p.caption,
    p.created_at,
    COUNT(DISTINCT l.id) as likes_count,
    COUNT(DISTINCT c.id) as comments_count
FROM public.posts p
LEFT JOIN public.likes l ON p.id = l.post_id
LEFT JOIN public.comments c ON p.id = c.post_id
GROUP BY p.id, p.user_id, p.image_url, p.caption, p.created_at;

-- 사용자 통계 뷰 (게시물 수, 팔로워 수, 팔로잉 수)
CREATE OR REPLACE VIEW public.user_stats
WITH (security_invoker = true)
AS
SELECT
    u.id as user_id,
    u.clerk_id,
    u.name,
    COUNT(DISTINCT p.id) as posts_count,
    COUNT(DISTINCT f1.id) as followers_count,  -- 나를 팔로우하는 사람들
    COUNT(DISTINCT f2.id) as following_count   -- 내가 팔로우하는 사람들
FROM public.users u
LEFT JOIN public.posts p ON u.id = p.user_id
LEFT JOIN public.follows f1 ON u.id = f1.following_id
LEFT JOIN public.follows f2 ON u.id = f2.follower_id
GROUP BY u.id, u.clerk_id, u.name;

-- ============================================
-- Post Stats 뷰 RLS 설정
-- ============================================

-- 뷰에 RLS 활성화 (뷰에도 RLS 적용 가능)
ALTER VIEW public.post_stats SET (security_barrier = true);

-- 개발용 임시 정책 (모든 인증된 사용자 접근 허용)
CREATE POLICY "Development: authenticated users can view post stats"
ON public.post_stats FOR SELECT
TO authenticated
USING (true);

-- 서비스 역할 정책
CREATE POLICY "Service role has full access to post stats"
ON public.post_stats FOR ALL
TO service_role
USING (true);

-- ============================================
-- 프로덕션용 엄격한 RLS 정책들 (주석 처리)
-- ============================================

/*
-- 프로덕션용: 모든 인증된 사용자가 게시물 통계 조회 가능
CREATE POLICY "Authenticated users can view all post stats"
ON public.post_stats FOR SELECT
TO authenticated
USING (true);
*/

-- 뷰 권한 부여
GRANT SELECT ON public.post_stats TO anon;
GRANT SELECT ON public.post_stats TO authenticated;
GRANT SELECT ON public.post_stats TO service_role;

-- ============================================
-- User Stats 뷰 RLS 설정
-- ============================================

-- 뷰에 RLS 활성화
ALTER VIEW public.user_stats SET (security_barrier = true);

-- 개발용 임시 정책
CREATE POLICY "Development: authenticated users can view user stats"
ON public.user_stats FOR SELECT
TO authenticated
USING (true);

-- 서비스 역할 정책
CREATE POLICY "Service role has full access to user stats"
ON public.user_stats FOR ALL
TO service_role
USING (true);

-- ============================================
-- 프로덕션용 엄격한 RLS 정책들 (주석 처리)
-- ============================================

/*
-- 프로덕션용: 모든 인증된 사용자가 사용자 통계 조회 가능
CREATE POLICY "Authenticated users can view all user stats"
ON public.user_stats FOR SELECT
TO authenticated
USING (true);
*/

GRANT SELECT ON public.user_stats TO anon;
GRANT SELECT ON public.user_stats TO authenticated;
GRANT SELECT ON public.user_stats TO service_role;

-- ============================================
-- 7. 트리거 함수 (updated_at 자동 업데이트)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- posts 테이블에 트리거 적용
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- comments 테이블에 트리거 적용
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
