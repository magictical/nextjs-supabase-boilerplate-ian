"use client";

import { useState } from "react";
import { ProfileHeader } from "./ProfileHeader";
import { PostGrid } from "./PostGrid";
import { PostModal } from "@/components/post/PostModal";
import { UserStats } from "@/lib/types";
import { useUser } from "@clerk/nextjs";

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
  currentUserSupabaseId?: string;
}

export function ProfilePageClient({
  userId,
  user,
  isFollowing: initialIsFollowing,
  isOwnProfile,
  currentUserSupabaseId,
}: ProfilePageClientProps) {
  const { user: clerkUser } = useUser();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [userStats, setUserStats] = useState(user);

  // 게시물 클릭 핸들러
  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setSelectedPostId(null);
  };

  // 팔로우 성공 핸들러
  const handleFollow = async (targetUserId: string) => {
    setIsFollowing(true);
    // 통계 정보 업데이트 (followers_count +1)
    setUserStats(prev => ({
      ...prev,
      followers_count: prev.followers_count + 1
    }));
  };

  // 언팔로우 성공 핸들러
  const handleUnfollow = async (targetUserId: string) => {
    setIsFollowing(false);
    // 통계 정보 업데이트 (followers_count -1)
    setUserStats(prev => ({
      ...prev,
      followers_count: Math.max(0, prev.followers_count - 1)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 프로필 헤더 */}
      <ProfileHeader
        user={userStats}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        currentUserSupabaseId={currentUserSupabaseId}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />

      {/* 게시물 그리드 */}
      <div className="max-w-[975px] mx-auto px-4 py-8">
        <PostGrid
          userId={user.user_id} // Supabase user_id (UUID)
          onPostClick={handlePostClick}
        />

        {/* 게시물 피드 (프로필 페이지에서는 숨김 처리) */}
        {/* TODO: 프로필 페이지에서 게시물 피드를 별도로 표시할지 결정 */}
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
