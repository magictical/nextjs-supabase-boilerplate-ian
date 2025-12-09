"use client";

import { useState } from "react";
import { ProfileHeader } from "./ProfileHeader";
import { PostGrid } from "./PostGrid";
import { PostModal } from "@/components/post/PostModal";
import { UserStats } from "@/lib/types";

/**
 * 프로필 페이지 클라이언트 컴포넌트
 *
 * 모달 상태 관리 및 게시물 상세 모달 통합
 */

interface ProfilePageClientProps {
  userId: string;
  user: UserStats;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export function ProfilePageClient({
  userId,
  user,
  isFollowing,
  isOwnProfile,
}: ProfilePageClientProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // 게시물 클릭 핸들러
  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setSelectedPostId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 프로필 헤더 */}
      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollowChange={(isFollowing) => {
          // 팔로우 기능 구현 시 여기에 로직 추가
          console.log('Follow change:', isFollowing);
        }}
      />

      {/* 게시물 그리드 */}
      <div className="max-w-[975px] mx-auto px-4 py-8">
        <PostGrid
          userId={user.user_id} // Supabase user_id (UUID)
          onPostClick={handlePostClick}
        />
      </div>

      {/* 게시물 상세 모달 */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          isOpen={selectedPostId !== null}
          onClose={handleCloseModal}
          // 프로필 페이지에서는 이전/다음 게시물 네비게이션이 필요 없음
          onPrevious={undefined}
          onNext={undefined}
          hasPrevious={false}
          hasNext={false}
        />
      )}
    </div>
  );
}
