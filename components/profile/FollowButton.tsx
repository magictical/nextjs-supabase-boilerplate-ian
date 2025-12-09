"use client";

import { useState } from "react";
import { FollowButtonProps } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { handleFetchError, logError } from "@/lib/utils/error-handler";

/**
 * 팔로우 버튼 컴포넌트
 *
 * Instagram-like 팔로우 버튼 UI
 * - 팔로우/팔로잉 상태에 따른 버튼 표시
 * - Hover 시 언팔로우 표시
 * - 클릭 시 즉시 API 호출 및 UI 업데이트
 * - 낙관적 업데이트 적용
 */

export function FollowButton({
  targetUserId,
  currentUserId,
  isFollowing,
  onFollow,
  onUnfollow,
}: FollowButtonProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticFollowing, setOptimisticFollowing] = useState(isFollowing);
  const [isHovered, setIsHovered] = useState(false);

  // 자기 자신인 경우 버튼 표시하지 않음
  if (currentUserId === targetUserId) {
    return null;
  }

  const handleFollowToggle = async () => {
    if (isLoading) return;

    const wasFollowing = optimisticFollowing;
    const willBeFollowing = !wasFollowing;

    // 낙관적 업데이트: UI를 즉시 변경
    setOptimisticFollowing(willBeFollowing);
    setIsLoading(true);

    try {
      if (willBeFollowing) {
        // 팔로우 추가
        let response: Response | null = null;
        try {
          response = await fetch("/api/follows", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ following_id: targetUserId }),
          });
        } catch (fetchErr) {
          const errorInfo = await handleFetchError(null, fetchErr);
          logError(errorInfo, "FollowButton.handleFollowToggle");
          throw new Error(errorInfo.message);
        }

        if (!response.ok) {
          const errorInfo = await handleFetchError(response, null);
          logError(errorInfo, "FollowButton.handleFollowToggle");
          throw new Error(errorInfo.message);
        }

        // 성공 콜백 호출
        onFollow?.(targetUserId);
      } else {
        // 팔로우 제거
        let response: Response | null = null;
        try {
          response = await fetch("/api/follows", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ following_id: targetUserId }),
          });
        } catch (fetchErr) {
          const errorInfo = await handleFetchError(null, fetchErr);
          logError(errorInfo, "FollowButton.handleFollowToggle");
          throw new Error(errorInfo.message);
        }

        if (!response.ok) {
          const errorInfo = await handleFetchError(response, null);
          logError(errorInfo, "FollowButton.handleFollowToggle");
          throw new Error(errorInfo.message);
        }

        // 성공 콜백 호출
        onUnfollow?.(targetUserId);
      }
    } catch (error) {
      // 에러 발생 시 낙관적 업데이트 롤백
      setOptimisticFollowing(wasFollowing);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      logError(
        {
          type: "UNKNOWN_ERROR",
          message: errorMessage,
          originalError: error,
        },
        "FollowButton.handleFollowToggle",
      );
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const displayFollowing = optimisticFollowing;

  const buttonLabel = displayFollowing
    ? isHovered
      ? "언팔로우"
      : "팔로잉"
    : "팔로우";

  return (
    <button
      onClick={handleFollowToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      aria-label={buttonLabel}
      className={`px-6 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
        displayFollowing
          ? isHovered
            ? "bg-red-50 text-red-600 border border-red-300 hover:bg-red-100"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          : "bg-blue-500 text-white hover:bg-blue-600"
      } ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
    >
      {isLoading ? (
        // 로딩 상태
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>처리 중...</span>
        </div>
      ) : displayFollowing ? (
        // 팔로우 중 상태
        isHovered ? (
          "언팔로우"
        ) : (
          "팔로잉"
        )
      ) : (
        // 미팔로우 상태
        "팔로우"
      )}
    </button>
  );
}
