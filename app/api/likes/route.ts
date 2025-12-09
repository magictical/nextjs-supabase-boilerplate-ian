import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 좋아요 API Route
 *
 * POST /api/likes - 좋아요 추가
 * DELETE /api/likes - 좋아요 제거
 *
 * 요청 본문: { post_id: string }
 */

/**
 * 좋아요 추가 API
 */
export async function POST(request: NextRequest) {
  try {
    console.log("API /api/likes POST called");

    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { post_id } = body;

    // 유효성 검증
    if (!post_id) {
      return NextResponse.json(
        { error: "게시물 ID가 필요합니다." },
        { status: 400 }
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

    // 2. 게시물 존재 확인
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .single();

    if (postError || !postData) {
      console.error("Post lookup error:", postError);
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. 좋아요 추가 (중복 방지: UNIQUE 제약조건 활용)
    const { data: likeData, error: likeError } = await supabase
      .from("likes")
      .insert({
        post_id: post_id,
        user_id: userData.id,
      })
      .select()
      .single();

    if (likeError) {
      // 이미 좋아요한 경우 (중복 키 에러)
      if (likeError.code === "23505") {
        return NextResponse.json(
          { error: "이미 좋아요한 게시물입니다." },
          { status: 409 }
        );
      }
      console.error("Like insertion error:", likeError);
      return NextResponse.json(
        { error: "좋아요 추가에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log("Like added successfully:", likeData.id);

    return NextResponse.json({
      success: true,
      like: likeData,
    });

  } catch (error) {
    console.error("Likes POST API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 좋아요 제거 API
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("API /api/likes DELETE called");

    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { post_id } = body;

    // 유효성 검증
    if (!post_id) {
      return NextResponse.json(
        { error: "게시물 ID가 필요합니다." },
        { status: 400 }
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

    // 2. 좋아요 제거
    const { data: deleteData, error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", post_id)
      .eq("user_id", userData.id)
      .select();

    if (deleteError) {
      console.error("Like deletion error:", deleteError);
      return NextResponse.json(
        { error: "좋아요 제거에 실패했습니다." },
        { status: 500 }
      );
    }

    // 삭제된 레코드가 없는 경우 (좋아요가 없었던 경우)
    if (!deleteData || deleteData.length === 0) {
      return NextResponse.json(
        { error: "좋아요가 존재하지 않습니다." },
        { status: 404 }
      );
    }

    console.log("Like removed successfully:", deleteData[0].id);

    return NextResponse.json({
      success: true,
      like: deleteData[0],
    });

  } catch (error) {
    console.error("Likes DELETE API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
