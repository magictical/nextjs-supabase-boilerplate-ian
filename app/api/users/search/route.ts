import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import {
  createUnauthorizedResponse,
  createBadRequestResponse,
  createServerErrorResponse,
} from "@/lib/utils/api-error";

/**
 * 사용자 검색 API
 *
 * GET /api/users/search?q={query}
 * - query: 검색할 사용자명 또는 아이디
 * - 인증 필요
 * - 사용자명 또는 clerk_id로 검색
 */
export async function GET(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return createUnauthorizedResponse();
    }

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return createBadRequestResponse("검색어를 입력해주세요.");
    }

    const supabase = createClerkSupabaseClient();

    // 사용자 검색 (name 또는 clerk_id로 검색)
    const { data: users, error: searchError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .or(`name.ilike.%${query}%,clerk_id.ilike.%${query}%`)
      .limit(20);

    if (searchError) {
      console.error("User search error:", searchError);
      return createServerErrorResponse(
        "사용자 검색에 실패했습니다.",
        searchError,
      );
    }

    return NextResponse.json({
      success: true,
      data: users || [],
    });
  } catch (error) {
    console.error("Users search API error:", error);
    return createServerErrorResponse(undefined, error);
  }
}


