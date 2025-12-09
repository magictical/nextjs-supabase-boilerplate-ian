"use client";

import { PostFeed } from "@/components/post/PostFeed";
import { useUser } from "@clerk/nextjs";

/**
 * Instagram 클론 홈 피드 페이지
 *
 * PostFeed 컴포넌트를 사용하여 게시물 목록 표시
 * - Stories 섹션은 추후 구현 (1차 MVP 제외)
 * - 배경색 #FAFAFA 설정 (레이아웃에서 처리됨)
 */
export default function HomePage() {
  const { user, isLoaded } = useUser();
  return (
    <>
      {/* Stories 섹션 숨김 (1차 MVP 제외 기능) */}
      {/* TODO: 2차 개발에서 스토리 기능 구현 예정 */}

      {/* 게시물 피드 */}
      <PostFeed currentUserId={isLoaded && user ? user.id : undefined} />
    </>
  );
}
