"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { handleFetchError, logError } from "@/lib/utils/error-handler";
import { useToast } from "@/components/ui/toast";

/**
 * Instagram 클론 LikeButton 컴포넌트
 *
 * PRD의 좋아요 기능 구현:
 * - 빈 하트 ↔ 빨간 하트 상태 관리
 * - 클릭 애니메이션 (scale 1.3 → 1, 0.15초)
 * - API 호출 (/api/likes POST/DELETE)
 * - Optimistic UI 업데이트
 * - 로딩 상태 (중복 클릭 방지)
 * - 에러 처리 (롤백)
 */

interface LikeButtonProps {
  postId: string;
  isLiked: boolean;
  likesCount: number;
  onLikeChange?: (newLikesCount: number, newIsLiked: boolean) => void;
  size?: "sm" | "md" | "lg"; // 기본값: 'md'
  showCount?: boolean; // 좋아요 수 표시 여부 (기본값: false)
}

export function LikeButton({
  postId,
  isLiked: initialIsLiked,
  likesCount: initialLikesCount,
  onLikeChange,
  size = "md",
  showCount = false,
}: LikeButtonProps) {
  const { showToast } = useToast();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // props 변경 시 내부 상태 동기화 (더블탭 등 외부에서 상태 변경 시)
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikesCount(initialLikesCount);
  }, [initialIsLiked, initialLikesCount]);

  // 크기별 스타일링
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  // 좋아요 토글 핸들러
  const handleLikeToggle = async () => {
    if (isLoading) return; // 로딩 중 중복 클릭 방지

    // Optimistic UI 업데이트
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);
    setIsAnimating(true);
    setIsLoading(true);

    // 애니메이션 타이머
    setTimeout(() => setIsAnimating(false), 150);

    try {
      const method = newIsLiked ? "POST" : "DELETE";
      let response: Response | null = null;

      try {
        response = await fetch("/api/likes", {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ post_id: postId }),
        });
      } catch (fetchErr) {
        // 네트워크 에러 처리
        const errorInfo = await handleFetchError(null, fetchErr);
        logError(errorInfo, "LikeButton.handleLikeToggle");

        // 에러 발생 시 Optimistic Update 롤백
        setIsLiked(!newIsLiked);
        setLikesCount(initialLikesCount);

        showToast(errorInfo.message, "error");
        return;
      }

      if (!response.ok) {
        const errorInfo = await handleFetchError(response, null);
        logError(errorInfo, "LikeButton.handleLikeToggle");

        // 에러 발생 시 Optimistic Update 롤백
        setIsLiked(!newIsLiked);
        setLikesCount(initialLikesCount);

        showToast(errorInfo.message, "error");
        return;
      }

      const data = await response.json();

      // 부모 컴포넌트에 변경사항 알림
      if (onLikeChange) {
        onLikeChange(newLikesCount, newIsLiked);
      }
    } catch (error) {
      // 예상치 못한 에러 처리
      const errorInfo = await handleFetchError(null, error);
      logError(errorInfo, "LikeButton.handleLikeToggle");

      // 에러 발생 시 Optimistic Update 롤백
      setIsLiked(!newIsLiked);
      setLikesCount(initialLikesCount);

      showToast(errorInfo.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      aria-label={isLiked ? "좋아요 취소" : "좋아요"}
      aria-pressed={isLiked}
      className={`
        flex items-center space-x-2 transition-transform duration-150 ease-out
        hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-50
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded
        ${isAnimating ? "scale-[1.3]" : "scale-100"}
      `}
    >
      <Heart
        className={`
          ${sizeClasses[size]}
          ${isLiked ? "fill-red-500 text-red-500" : "text-black"}
          transition-colors duration-150
        `}
      />

      {showCount && (
        <span className="text-sm font-semibold text-black">
          {likesCount.toLocaleString()}
        </span>
      )}
    </button>
  );
}
