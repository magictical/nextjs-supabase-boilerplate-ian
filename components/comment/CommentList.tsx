"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MoreHorizontal } from "lucide-react";
import { CommentWithUser } from "@/lib/types";
import { cn } from "@/lib/supabase/utils";

/**
 * 댓글 목록 컴포넌트
 *
 * Instagram 스타일의 댓글 목록을 표시합니다.
 * - PostCard용: 최신 댓글만 표시 (maxComments 제한)
 * - 상세 모달용: 전체 댓글 표시 + 스크롤 가능
 * - 삭제 버튼: 본인 댓글만 표시
 * - 상대 시간 표시
 * - 사용자명 클릭 시 프로필 페이지로 이동
 */
interface CommentListProps {
  comments: CommentWithUser[];
  currentUserId?: string; // Clerk user ID
  maxComments?: number; // PostCard용: 2, 상세용: undefined
  onDelete?: (commentId: string) => void;
  showDeleteButton?: boolean; // 기본값: true
  className?: string;
}

export function CommentList({
  comments,
  currentUserId,
  maxComments,
  onDelete,
  showDeleteButton = true,
  className,
}: CommentListProps) {
  const { user: currentUser } = useUser();
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // 표시할 댓글들 (maxComments 제한)
  const displayComments = maxComments ? comments.slice(0, maxComments) : comments;

  // 상대 시간 계산 함수
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}초 전`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}주 전`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}달 전`;
    return `${Math.floor(diffInSeconds / 31536000)}년 전`;
  };

  // 댓글 삭제 핸들러
  const handleDeleteComment = async (commentId: string) => {
    if (!onDelete || deletingCommentId) return;

    setDeletingCommentId(commentId);

    try {
      await onDelete(commentId);
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  // 사용자명 클릭 핸들러 (프로필 페이지 이동)
  const handleUserClick = (clerkUserId: string) => {
    // 현재는 로그만 출력 (프로필 페이지 구현 시 연결)
    console.log("사용자 프로필 이동:", clerkUserId);
    // window.location.href = `/profile/${clerkUserId}`;
  };

  if (displayComments.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {displayComments.map((comment) => {
        const isOwnComment = currentUserId === comment.clerk_id;
        const isDeleting = deletingCommentId === comment.id;

        return (
          <div key={comment.id} className="flex items-start space-x-2 group">
            {/* 사용자명 + 댓글 내용 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-black leading-relaxed break-words">
                <button
                  onClick={() => handleUserClick(comment.clerk_id)}
                  className="font-semibold hover:underline transition-colors"
                >
                  {comment.name}
                </button>{" "}
                <span className="whitespace-pre-wrap">{comment.content}</span>
              </p>

              {/* 상대 시간 */}
              <p className="text-xs text-gray-500 mt-1">
                {getRelativeTime(comment.created_at)}
              </p>
            </div>

            {/* 삭제 버튼 (본인 댓글만, showDeleteButton가 true일 때) */}
            {showDeleteButton && isOwnComment && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                disabled={isDeleting}
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "p-1 hover:bg-gray-100 rounded-full",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                title="댓글 삭제"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
