import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 댓글 관련 API
 *
 * POST /api/comments - 댓글 작성
 * DELETE /api/comments - 댓글 삭제
 */

export async function POST(request: NextRequest) {
  try {
    console.log("API /api/comments POST called");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const { post_id, content } = await request.json();

    // 유효성 검증
    if (!post_id || !content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "post_id와 content가 필요합니다." },
        { status: 400 }
      );
    }

    if (content.trim().length > 500) {
      return NextResponse.json(
        { error: "댓글은 500자 이하여야 합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // Clerk ID로 Supabase user_id 조회
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

    // 댓글 삽입
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id,
        user_id: userData.id,
        content: content.trim(),
      })
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
      .single();

    if (commentError) {
      console.error("Comment insert error:", commentError);
      return NextResponse.json(
        { error: "댓글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 응답 포맷 맞추기
    const response = {
      id: commentData.id,
      post_id: commentData.post_id,
      user_id: commentData.user_id,
      content: commentData.content,
      created_at: commentData.created_at,
      updated_at: commentData.updated_at,
      name: commentData.users.name,
      clerk_id: commentData.users.clerk_id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Comments POST API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("API /api/comments DELETE called");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const { comment_id } = await request.json();

    if (!comment_id) {
      return NextResponse.json(
        { error: "comment_id가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // Clerk ID로 Supabase user_id 조회
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

    // 댓글 존재 및 소유자 확인
    const { data: commentData, error: commentCheckError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", comment_id)
      .single();

    if (commentCheckError) {
      console.error("Comment check error:", commentCheckError);
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 본인 댓글인지 확인
    if (commentData.user_id !== userData.id) {
      return NextResponse.json(
        { error: "본인의 댓글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment_id);

    if (deleteError) {
      console.error("Comment delete error:", deleteError);
      return NextResponse.json(
        { error: "댓글 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comments DELETE API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
