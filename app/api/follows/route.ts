import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 팔로우 API Route
 *
 * POST /api/follows - 팔로우 추가
 * DELETE /api/follows - 팔로우 제거
 *
 * 요청 본문: { following_id: string } // 팔로우할 사용자의 Supabase UUID
 */

/**
 * 팔로우 추가 API
 */
export async function POST(request: NextRequest) {
  try {
    console.log("API /api/follows POST called");

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
    const { following_id } = body;

    // 유효성 검증
    if (!following_id) {
      return NextResponse.json(
        { error: "팔로우할 사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 1. 현재 사용자 정보 확인
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

    // 2. 팔로우할 사용자 존재 확인
    const { data: followingUserData, error: followingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", following_id)
      .single();

    if (followingUserError || !followingUserData) {
      console.error("Following user lookup error:", followingUserError);
      return NextResponse.json(
        { error: "팔로우할 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. 자기 자신 팔로우 방지
    if (userData.id === following_id) {
      return NextResponse.json(
        { error: "자기 자신을 팔로우할 수 없습니다." },
        { status: 400 }
      );
    }

    // 4. 팔로우 추가 (UNIQUE 제약조건으로 중복 방지)
    const { data: followData, error: followError } = await supabase
      .from("follows")
      .insert({
        follower_id: userData.id,
        following_id: following_id,
      })
      .select()
      .single();

    if (followError) {
      // UNIQUE 제약조건 위반 (이미 팔로우 중)
      if (followError.code === "23505") {
        return NextResponse.json(
          { error: "이미 팔로우하고 있습니다." },
          { status: 409 }
        );
      }
      console.error("Follow insert error:", followError);
      return NextResponse.json(
        { error: "팔로우 추가에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log("Follow created successfully:", followData.id);

    return NextResponse.json({
      success: true,
      follow: followData
    });

  } catch (error) {
    console.error("Follow POST API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 팔로우 제거 API
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("API /api/follows DELETE called");

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
    const { following_id } = body;

    // 유효성 검증
    if (!following_id) {
      return NextResponse.json(
        { error: "팔로우 해제할 사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 1. 현재 사용자 정보 확인
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

    // 2. 팔로우 제거
    const { data: deleteData, error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userData.id)
      .eq("following_id", following_id)
      .select();

    if (deleteError) {
      console.error("Follow deletion error:", deleteError);
      return NextResponse.json(
        { error: "팔로우 제거에 실패했습니다." },
        { status: 500 }
      );
    }

    // 삭제된 레코드가 없는 경우 (팔로우 관계가 없었던 경우)
    if (!deleteData || deleteData.length === 0) {
      return NextResponse.json(
        { error: "팔로우 관계가 존재하지 않습니다." },
        { status: 404 }
      );
    }

    console.log("Follow removed successfully:", deleteData[0].id);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error("Follow DELETE API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
