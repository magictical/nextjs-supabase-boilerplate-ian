import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * 사용자 정보 조회 API
 *
 * GET /api/users/[userId]
 * - 사용자 통계 정보 조회 (user_stats 뷰 활용)
 * - 팔로우 관계 확인 (팔로우 기능 구현 전까지는 false)
 * - 본인 프로필 여부 확인
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log(`API /api/users/${params.userId} called`);

    const { userId: requestedUserId } = params;

    // 유효성 검증
    if (!requestedUserId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 로그인 사용자 확인 (옵션: 비로그인 사용자도 프로필 조회 가능)
    const { userId: currentUserId } = await auth();
    console.log("Current user ID:", currentUserId);

    const supabase = createClerkSupabaseClient();

    // 1. 사용자 정보 조회 (user_stats 뷰 활용)
    const { data: userData, error: userError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("clerk_id", requestedUserId)
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 본인 프로필 여부 확인
    const isOwnProfile = currentUserId === requestedUserId;

    // 3. 팔로우 관계 확인 (팔로우 기능 구현 전까지는 false)
    // TODO: 팔로우 기능 구현 시 실제 팔로우 관계 확인 로직 추가
    let isFollowing = false;

    // 팔로우 기능이 구현되면 아래 로직으로 교체
    /*
    if (currentUserId && !isOwnProfile) {
      const { data: followData, error: followError } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", (
          await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", currentUserId)
            .single()
        ).data?.id)
        .eq("following_id", userData.user_id)
        .single();

      if (followError) {
        console.error("Follow check error:", followError);
        // 에러가 발생해도 프로필 조회는 계속 진행
      } else {
        isFollowing = !!followData;
      }
    }
    */

    return NextResponse.json({
      user: userData,
      isFollowing,
      isOwnProfile,
    });

  } catch (error) {
    console.error("User profile API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
