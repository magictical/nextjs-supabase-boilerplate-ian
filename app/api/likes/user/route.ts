import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import {
  createUnauthorizedResponse,
  createServerErrorResponse,
} from "@/lib/utils/api-error";
import { PostWithUser } from "@/lib/types";

/**
 * 사용자가 좋아요한 게시물 목록 조회 API
 *
 * GET /api/likes/user
 * - 인증 필요
 * - 현재 사용자가 좋아요한 게시물 목록 반환
 * - 페이지네이션 지원 (limit, offset)
 */
export async function GET(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return createUnauthorizedResponse();
    }

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = createClerkSupabaseClient();

    // 1. 현재 사용자 정보 확인
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return createServerErrorResponse(
        "사용자를 찾을 수 없습니다.",
        userError
      );
    }

    // 2. 사용자가 좋아요한 게시물 ID 조회
    const { data: likes, error: likesError } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (likesError) {
      console.error("Likes fetch error:", likesError);
      return createServerErrorResponse(
        "좋아요한 게시물 조회에 실패했습니다.",
        likesError
      );
    }

    const postIds = likes?.map((like) => like.post_id) || [];
    let postsWithStats: PostWithUser[] = [];

    // 3. 게시물 정보 및 통계 조회 (post_stats 뷰 활용)
    if (postIds.length > 0) {
      const { data: postStats, error: statsError } = await supabase
        .from("post_stats")
        .select(`
          post_id,
          user_id,
          image_url,
          caption,
          created_at,
          likes_count,
          comments_count,
          users!inner (
            id,
            clerk_id,
            name,
            created_at
          )
        `)
        .in("post_id", postIds)
        .order("created_at", { ascending: false });

      if (statsError) {
        console.error("Post stats fetch error:", statsError);
        return createServerErrorResponse(
          "게시물 정보 조회에 실패했습니다.",
          statsError
        );
      }

      if (postStats) {
        // PostWithUser 형식으로 변환
        postsWithStats = postStats.map((stat: any) => ({
          post_id: stat.post_id,
          user_id: stat.user_id,
          clerk_id: stat.users.clerk_id,
          name: stat.users.name,
          image_url: stat.image_url,
          caption: stat.caption,
          created_at: stat.created_at,
          updated_at: stat.created_at, // post_stats에는 updated_at이 없으므로 created_at 사용
          likes_count: stat.likes_count || 0,
          comments_count: stat.comments_count || 0,
          isLiked: true, // 이 API는 좋아요한 게시물만 반환하므로 항상 true
          recentComments: [], // 활동 페이지에서는 댓글 미리보기 불필요
        }));
      }
    }

    // 4. 다음 페이지 존재 여부 확인
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userData.id);

    const hasMore = count ? offset + limit < count : false;

    return NextResponse.json({
      success: true,
      data: postsWithStats,
      pagination: {
        limit,
        offset,
        hasMore,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error("Likes user API error:", error);
    return createServerErrorResponse(undefined, error);
  }
}

