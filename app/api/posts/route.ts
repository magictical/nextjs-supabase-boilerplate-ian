import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { PostsResponse } from "@/lib/types";

/**
 * 게시물 목록 조회 API
 *
 * GET /api/posts
 * - 게시물 목록 조회 (홈 피드)
 * - 페이지네이션 지원
 * - 사용자별 필터링 지원 (프로필 페이지용)
 * - 좋아요 상태 및 댓글 포함
 */

/**
 * 게시물 생성 API
 *
 * POST /api/posts
 * - 새 게시물 생성
 * - 이미지 파일 업로드 (Supabase Storage)
 * - posts 테이블에 데이터 저장
 * - 인증 필수
 */

export async function POST(request: NextRequest) {
  try {
    console.log("API /api/posts POST called");

    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const caption = formData.get("caption") as string;
    const formUserId = formData.get("userId") as string;

    // 유효성 검증
    if (!file) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    if (formUserId !== userId) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 1. 사용자 정보 확인
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 파일명을 안전하게 생성
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    // uploads 버킷 정책에 맞춰 첫 번째 폴더가 user ID가 되도록 경로 설정
    const filePath = `${userId}/posts/${fileName}`;

    // 3. Supabase Storage에 업로드
    console.log("Uploading to storage:", filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // 상세한 에러 정보를 로그에 기록
      console.error("Upload error details:", {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
      });
      return NextResponse.json(
        { 
          error: "이미지 업로드에 실패했습니다.",
          details: uploadError.message || "알 수 없는 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }

    // 4. 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from("uploads")
      .getPublicUrl(filePath);

    // 5. posts 테이블에 저장
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: userData.id,
        image_url: publicUrl,
        caption: caption || null,
      })
      .select()
      .single();

    if (postError) {
      console.error("Post creation error:", postError);
      // 업로드된 파일 정리 (실패 시)
      await supabase.storage
        .from("uploads")
        .remove([filePath]);

      return NextResponse.json(
        { error: "게시물 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log("Post created successfully:", postData.id);

    return NextResponse.json({
      success: true,
      post: postData,
    });

  } catch (error) {
    console.error("Posts POST API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("API /api/posts called");

    // Clerk 인증 확인 (비로그인 사용자도 게시물 조회 가능)
    const { userId: currentUserId } = await auth();
    console.log("Current user ID:", currentUserId);

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // 최대 50개
    const offset = parseInt(searchParams.get("offset") || "0");
    const userId = searchParams.get("userId"); // 특정 사용자의 게시물만 조회 (프로필용)

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();
    console.log("Supabase client created successfully");

    // 1. 게시물 총 개수 조회
    console.log("Starting count query...");
    let countQuery = supabase
      .from("post_stats")
      .select("post_id", { count: "exact", head: true });

    if (userId) {
      countQuery = countQuery.eq("user_id", userId);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Count query error:", countError);
      return NextResponse.json(
        { error: "Failed to count posts" },
        { status: 500 }
      );
    }

    const total = totalCount || 0;

    // 2. 게시물 목록 조회 (post_stats 뷰 활용)
    let postsQuery = supabase
      .from("post_stats")
      .select(`
        post_id,
        user_id,
        image_url,
        caption,
        created_at,
        likes_count,
        comments_count,
        users!inner(name, clerk_id)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      postsQuery = postsQuery.eq("user_id", userId);
    }

    const { data: postsData, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("Posts query error:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    if (!postsData || postsData.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      } satisfies PostsResponse);
    }

    // 3. 좋아요 상태 조회 (현재 사용자가 로그인한 경우)
    let likesMap = new Map<string, boolean>();

    if (currentUserId) {
      const postIds = postsData.map(post => post.post_id);

      // 먼저 users 테이블에서 clerk_id로 user_id 조회
      const { data: userData, error: userLookupError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", currentUserId)
        .single();

      if (userLookupError) {
        console.error("User lookup error for likes:", userLookupError);
        // 사용자 조회 실패해도 게시물 조회는 계속 진행 (좋아요 상태는 표시되지 않음)
      } else if (userData) {
        const { data: likesData, error: likesError } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", userData.id)
          .in("post_id", postIds);

        if (likesError) {
          console.error("Likes query error:", likesError);
          // 좋아요 조회 실패해도 게시물 조회는 계속 진행
        } else if (likesData) {
          likesData.forEach(like => {
            likesMap.set(like.post_id, true);
          });
        }
      }
    }

    // 4. 최신 댓글 2개 조회
    const postIds = postsData.map(post => post.post_id);

    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select(`
        id,
        post_id,
        user_id,
        content,
        created_at,
        updated_at,
        users!inner(name, clerk_id)
      `)
      .in("post_id", postIds)
      .order("created_at", { ascending: false })
      .limit(2 * postIds.length); // 각 게시물당 최대 2개씩 조회

    if (commentsError) {
      console.error("Comments query error:", commentsError);
      // 댓글 조회 실패해도 게시물 조회는 계속 진행
    }

    // 댓글을 게시물별로 그룹화
    const commentsMap = new Map<string, any[]>();
    if (commentsData) {
      // 각 게시물당 최신 2개 댓글만 유지
      const groupedComments = new Map<string, any[]>();

      commentsData.forEach(comment => {
        const postComments = groupedComments.get(comment.post_id) || [];
        if (postComments.length < 2) {
          postComments.push(comment);
        }
        groupedComments.set(comment.post_id, postComments);
      });

      // 시간 역순으로 정렬 (최신순)
      groupedComments.forEach((comments, postId) => {
        comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        commentsMap.set(postId, comments);
      });
    }

    // 5. 응답 데이터 구성
    const posts: PostsResponse["data"] = postsData.map(post => ({
      post_id: post.post_id,
      user_id: post.user_id,
      image_url: post.image_url,
      caption: post.caption,
      created_at: post.created_at,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      name: post.users.name,
      clerk_id: post.users.clerk_id,
      isLiked: likesMap.get(post.post_id) || false,
      recentComments: commentsMap.get(post.post_id) || [],
    }));

    // 6. 페이지네이션 정보
    const hasMore = total > offset + limit;

    const response: PostsResponse = {
      data: posts,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Posts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
