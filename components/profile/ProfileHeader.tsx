"use client";

import { useUser } from "@clerk/nextjs";
import { UserStats } from "@/lib/types";
import { FollowButton } from "./FollowButton";

/**
 * 프로필 페이지 헤더 컴포넌트
 *
 * Instagram-like 프로필 헤더 UI
 * - 프로필 이미지 (Desktop 150px, Mobile 90px)
 * - 사용자명, 통계 정보 표시
 * - 본인/타인 프로필에 따른 버튼 표시
 * - 반응형 레이아웃 (가로/세로)
 */

interface ProfileHeaderProps {
  user: UserStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
  currentUserSupabaseId?: string;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
}

export function ProfileHeader({
  user,
  isOwnProfile,
  isFollowing,
  currentUserSupabaseId,
  onFollow,
  onUnfollow
}: ProfileHeaderProps) {
  const { user: currentUser } = useUser();

  // 통계 포맷팅 함수
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };


  // 프로필 편집 버튼 클릭 (1차 MVP 제외)
  const handleEditProfile = () => {
    alert("프로필 편집 기능은 2차 개발에서 제공됩니다.");
  };

  // 통계 클릭 핸들러 (팔로워/팔로잉 목록은 1차 MVP 제외)
  const handleStatClick = (type: 'followers' | 'following') => {
    if (type === 'posts') {
      // 게시물로 스크롤 (추후 구현)
      return;
    }
    alert(`${type === 'followers' ? '팔로워' : '팔로잉'} 목록은 2차 개발에서 제공됩니다.`);
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-[975px] mx-auto px-4 py-8">
        {/* Desktop: 가로 배치 */}
        <div className="flex items-center justify-center md:justify-start gap-8 md:gap-16">
          {/* 프로필 이미지 */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-gray-200 overflow-hidden">
              {currentUser?.imageUrl && isOwnProfile ? (
                <img
                  src={currentUser.imageUrl}
                  alt={`${user.name} 프로필 이미지`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <svg className="w-12 h-12 md:w-20 md:h-20 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* 프로필 정보 */}
          <div className="flex-1 min-w-0">
            {/* 사용자명과 버튼 */}
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-xl md:text-2xl font-light text-gray-900 truncate">
                {user.name}
              </h1>

              {/* 버튼 영역 */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  // 본인 프로필: 프로필 편집 버튼
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    프로필 편집
                  </button>
                ) : (
                  // 타인 프로필: 팔로우 버튼
                  <FollowButton
                    targetUserId={user.user_id}
                    currentUserId={currentUserSupabaseId}
                    isFollowing={isFollowing}
                    onFollow={onFollow}
                    onUnfollow={onUnfollow}
                  />
                )}
              </div>
            </div>

            {/* Mobile: 통계 정보 (세로 배치) */}
            <div className="md:hidden mb-4">
              <div className="flex justify-around">
                <button
                  onClick={() => handleStatClick('posts')}
                  className="text-center"
                >
                  <div className="font-semibold text-lg">{formatCount(user.posts_count)}</div>
                  <div className="text-gray-500 text-sm">게시물</div>
                </button>
                <button
                  onClick={() => handleStatClick('followers')}
                  className="text-center"
                >
                  <div className="font-semibold text-lg">{formatCount(user.followers_count)}</div>
                  <div className="text-gray-500 text-sm">팔로워</div>
                </button>
                <button
                  onClick={() => handleStatClick('following')}
                  className="text-center"
                >
                  <div className="font-semibold text-lg">{formatCount(user.following_count)}</div>
                  <div className="text-gray-500 text-sm">팔로잉</div>
                </button>
              </div>
            </div>

            {/* Desktop: 통계 정보 (가로 배치) */}
            <div className="hidden md:flex items-center gap-8 mb-4">
              <button
                onClick={() => handleStatClick('posts')}
                className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <span className="font-semibold">{user.posts_count.toLocaleString()}</span>
                <span className="text-gray-600">게시물</span>
              </button>
              <button
                onClick={() => handleStatClick('followers')}
                className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <span className="font-semibold">{user.followers_count.toLocaleString()}</span>
                <span className="text-gray-600">팔로워</span>
              </button>
              <button
                onClick={() => handleStatClick('following')}
                className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <span className="font-semibold">{user.following_count.toLocaleString()}</span>
                <span className="text-gray-600">팔로잉</span>
              </button>
            </div>

            {/* 이름 (추후 bio로 확장 가능) */}
            <div className="hidden md:block">
              <p className="font-semibold text-gray-900">{user.name}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
