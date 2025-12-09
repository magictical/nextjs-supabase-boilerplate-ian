import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/**
 * 본인 프로필 리다이렉트 페이지
 *
 * /profile로 접근 시 현재 로그인된 사용자의 프로필로 리다이렉트
 * - 로그인하지 않은 경우: /sign-in으로 리다이렉트
 * - 로그인한 경우: /profile/{userId}로 리다이렉트
 */

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    redirect("/sign-in");
  }

  // 로그인한 경우 본인 프로필 페이지로 리다이렉트
  redirect(`/profile/${userId}`);
}
