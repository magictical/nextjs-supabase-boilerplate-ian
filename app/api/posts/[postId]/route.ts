import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 게시물 상세 조회 API
 *
 * GET /api/posts/[postId]
 * - 게시물 상세 정보 조회 (post_stats 뷰 활용)
 * - 사용자 정보 포함
 * - 좋아요 상태 확인
 * - 전체 댓글 목록 조회 (최신순, 제한 없음)
 * - 댓글 작성자 정보 포함
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    console.log(`API /api/posts/${params.postId} GET called`);

    const { postId } = params;

    // 유효성 검증
    if (!postId) {
      return NextResponse.json(
        { error: "postId가 필요합니다." },
        { status: 400 }
      );
    }

    // Clerk 인증 확인 (옵션: 로그인하지 않은 사용자도 게시물 조회 가능)
    const { userId: currentUserId } = await auth();
    console.log("Current user ID:", currentUserId);

    const supabase = createClerkSupabaseClient();

    // 1. 게시물 상세 정보 조회 (post_stats 뷰 활용)
    const { data: postData, error: postError } = await supabase
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
          clerk_id,
          name
        )
      `)
      .eq("post_id", postId)
      .single();

    if (postError || !postData) {
      console.error("Post lookup error:", postError);
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 좋아요 상태 확인 (현재 사용자가 로그인한 경우)
    let isLiked = false;
    if (currentUserId) {
      const { data: likeData, error: likeError } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", (
          await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", currentUserId)
            .single()
        ).data?.id);

      if (likeError) {
        console.error("Like check error:", likeError);
        // 에러가 발생해도 게시물 조회는 계속 진행
      } else {
        isLiked = !!likeData;
      }
    }

    // 3. 전체 댓글 목록 조회 (최신순, 제한 없음)
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select(`
        id,
        post_id,
        user_id,
        content,
        created_at,
        updated_at,
        users!inner (
          name,
          clerk_id
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: false }); // 최신순 정렬

    if (commentsError) {
      console.error("Comments lookup error:", commentsError);
      return NextResponse.json(
        { error: "댓글을 불러오는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 4. 응답 데이터 포맷팅
    const post: any = {
      post_id: postData.post_id,
      user_id: postData.user_id,
      image_url: postData.image_url,
      caption: postData.caption,
      created_at: postData.created_at,
      likes_count: postData.likes_count,
      comments_count: postData.comments_count,
      name: postData.users.name,
      clerk_id: postData.users.clerk_id,
      isLiked,
      recentComments: commentsData.slice(0, 2), // 호환성을 위해 포함 (모달에서는 전체 사용)
    };

    const comments: any[] = commentsData.map(comment => ({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      name: comment.users.name,
      clerk_id: comment.users.clerk_id,
    }));

    return NextResponse.json({
      post,
      comments,
    });

  } catch (error) {
    console.error("Post detail API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 게시물 삭제 API
 *
 * DELETE /api/posts/[postId]
 * - 게시물 삭제 (본인만 가능)
 * - Supabase Storage에서 이미지 파일 삭제
 * - posts 테이블에서 레코드 삭제 (CASCADE로 likes, comments 자동 삭제)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    console.log(`API /api/posts/${params.postId} DELETE called`);

    const { postId } = params;

    // 유효성 검증
    if (!postId) {
      return NextResponse.json(
        { error: "postId가 필요합니다." },
        { status: 400 }
      );
    }

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 1. 현재 사용자 정보 확인
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 게시물 존재 확인 및 소유자 검증
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !postData) {
      console.error("Post lookup error:", postError);
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. 본인 게시물인지 확인
    if (postData.user_id !== userData.id) {
      return NextResponse.json(
        { error: "본인의 게시물만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 4. 이미지 파일 경로 추출
    // image_url 형식: https://[project].supabase.co/storage/v1/object/public/uploads/[userId]/posts/[fileName]
    let filePath = null;
    try {
      const url = new URL(postData.image_url);
      const pathParts = url.pathname.split('/');
      // /storage/v1/object/public/uploads/[userId]/posts/[fileName]
      // uploads 이후 부분 추출
      const uploadsIndex = pathParts.indexOf('uploads');
      if (uploadsIndex !== -1 && pathParts.length > uploadsIndex + 1) {
        filePath = pathParts.slice(uploadsIndex + 1).join('/');
      }
    } catch (error) {
      console.warn("Failed to parse image URL, skipping storage deletion:", error);
    }

    // 5. Supabase Storage에서 이미지 파일 삭제 (실패해도 DB 삭제는 계속 진행)
    if (filePath) {
      try {
        const { error: storageError } = await supabase.storage
          .from("uploads")
          .remove([filePath]);

        if (storageError) {
          console.warn("Storage deletion failed, but continuing with DB deletion:", storageError);
        } else {
          console.log("Storage file deleted successfully:", filePath);
        }
      } catch (storageError) {
        console.warn("Storage deletion exception, but continuing with DB deletion:", storageError);
      }
    }

    // 6. posts 테이블에서 게시물 삭제 (CASCADE로 likes, comments 자동 삭제)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Post deletion error:", deleteError);
      return NextResponse.json(
        { error: "게시물 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log("Post deleted successfully:", postId);

    return NextResponse.json({
      success: true,
      message: "게시물이 성공적으로 삭제되었습니다."
    });

  } catch (error) {
    console.error("Post DELETE API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}