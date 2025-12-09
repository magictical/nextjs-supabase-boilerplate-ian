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

    // 3. 팔로우 관계 확인
    let isFollowing = false;

    if (currentUserId && !isOwnProfile) {
      // 현재 사용자의 Supabase user_id 조회
      const { data: currentUserData, error: currentUserError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", currentUserId)
        .single();

      if (currentUserError || !currentUserData) {
        console.error("Current user lookup error:", currentUserError);
        // 에러가 발생해도 프로필 조회는 계속 진행 (isFollowing은 false로 유지)
      } else {
        // 팔로우 관계 확인
        const { data: followData, error: followError } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUserData.id)
          .eq("following_id", userData.user_id)
          .single();

        if (followError) {
          // 팔로우 관계가 없는 경우는 정상 (single()이므로 에러 발생)
          if (followError.code !== 'PGRST116') { // PGRST116: No rows found
            console.error("Follow check error:", followError);
          }
          // isFollowing은 이미 false로 초기화되어 있음
        } else {
          isFollowing = !!followData;
        }
      }
    }

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
