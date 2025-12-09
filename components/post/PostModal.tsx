"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LikeButton } from "./LikeButton";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import { PostWithUser, CommentWithUser } from "@/lib/types";

/**
 * 게시물 상세 모달 컴포넌트
 *
 * PRD 요구사항에 따라 구현:
 * - Desktop: Dialog 모달 (이미지 50% + 댓글 50%)
 * - Mobile: 전체 페이지로 전환
 * - 닫기 버튼 (✕)
 * - 이전/다음 네비게이션 (Desktop)
 * - 게시물 정보 표시 + 댓글 기능
 */
interface PostModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onCommentChange?: (postId: string, commentsCount: number, newComment?: any) => void;
  onCommentDelete?: (postId: string, commentId: string, commentsCount: number) => void;
}

export function PostModal({
  postId,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onCommentChange,
  onCommentDelete,
}: PostModalProps) {
  const { user: currentUser } = useUser();
  const [post, setPost] = useState<PostWithUser | null>(null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullCaption, setShowFullCaption] = useState(false);

  // 게시물 데이터 로딩
  const loadPostDetail = useCallback(async () => {
    if (!postId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        throw new Error("게시물을 불러올 수 없습니다.");
      }

      const data = await response.json();
      setPost(data.post);
      setComments(data.comments);
    } catch (err) {
      console.error("Post detail load error:", err);
      setError(err instanceof Error ? err.message : "게시물을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // postId 변경 시 데이터 리로드
  useEffect(() => {
    if (isOpen && postId) {
      loadPostDetail();
    }
  }, [isOpen, postId, loadPostDetail]);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setPost(null);
      setComments([]);
      setError(null);
      setShowFullCaption(false);
    }
  }, [isOpen]);

  // 댓글 작성 핸들러
  const handleComment = useCallback(async (content: string) => {
    if (!post) return;

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.post_id, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "댓글 작성에 실패했습니다.");
      }

      const newComment = await response.json();

      // 댓글 목록에 새 댓글 추가
      setComments(prev => [newComment, ...prev]);

      // 게시물 댓글 수 증가
      setPost(prev => prev ? {
        ...prev,
        comments_count: prev.comments_count + 1,
        recentComments: [newComment, ...prev.recentComments].slice(0, 2)
      } : null);

      // PostFeed 상태 동기화
      if (onCommentChange && post) {
        onCommentChange(post.post_id, prev.comments_count + 1, newComment);
      }

    } catch (error) {
      console.error("댓글 작성 오류:", error);
      throw error; // CommentForm에서 에러 처리
    }
  }, [post]);

  // 댓글 삭제 핸들러
  const handleCommentDelete = useCallback(async (commentId: string) => {
    if (!post) return;

    try {
      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "댓글 삭제에 실패했습니다.");
      }

      // 댓글 목록에서 제거
      setComments(prev => prev.filter(c => c.id !== commentId));

      // 게시물 댓글 수 감소
      const newCommentsCount = Math.max(0, prev.comments_count - 1);
      setPost(prev => prev ? {
        ...prev,
        comments_count: newCommentsCount,
        recentComments: prev.recentComments.filter(c => c.id !== commentId)
      } : null);

      // PostFeed 상태 동기화
      if (onCommentDelete && post) {
        onCommentDelete(post.post_id, commentId, newCommentsCount);
      }

    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      throw error;
    }
  }, [post]);

  // 좋아요 변경 핸들러
  const handleLikeChange = useCallback((newLikesCount: number, newIsLiked: boolean) => {
    setPost(prev => prev ? {
      ...prev,
      likes_count: newLikesCount,
      isLiked: newIsLiked
    } : null);
  }, []);

  // 상대 시간 표시 함수
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMs = now.getTime() - postTime.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;

    return postTime.toLocaleDateString("ko-KR");
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 게시물 데이터 없음
  if (!post) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* 이전/다음 네비게이션 버튼 (이미지 좌우에 배치) */}
        {hasPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/3 -translate-y-1/2 z-50 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/3 -translate-y-1/2 z-50 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        <div className="flex flex-col h-full max-h-[90vh]">
          {/* 이미지 영역 (항상 상단 전체) */}
          <div className="flex bg-black items-center justify-center min-h-[300px] max-h-[50vh]">
            <Image
              src={post.image_url}
              alt={`게시물 이미지 - ${post.name}`}
              width={500}
              height={500}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* 댓글 영역 (항상 하단 전체, 스크롤 가능) */}
          <div className="flex flex-col bg-white flex-1 overflow-hidden">
            {/* 게시물 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link
                href={`/profile/${post.clerk_id}`}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                  <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">
                      {post.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm text-black">{post.name}</p>
                </div>
              </Link>
              <button className="p-1 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 모바일용 이미지 (상단에 표시) */}
            <div className="md:hidden bg-black flex items-center justify-center min-h-[300px]">
              <Image
                src={post.image_url}
                alt={`게시물 이미지 - ${post.name}`}
                width={400}
                height={400}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* 댓글 목록 영역 - 스크롤 가능 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[40vh]">
              {/* 게시물 내용 */}
              <div>
                {/* 좋아요 버튼과 수 */}
                <div className="flex items-center space-x-4 mb-3">
                  <LikeButton
                    postId={post.post_id}
                    isLiked={post.isLiked}
                    likesCount={post.likes_count}
                    onLikeChange={handleLikeChange}
                  />
                  <button className="hover:opacity-60 transition-opacity">
                    <MessageCircle className="w-6 h-6 text-black" />
                  </button>
                  <button className="hover:opacity-60 transition-opacity">
                    <Send className="w-6 h-6 text-black" />
                  </button>
                  <div className="flex-1"></div>
                  <button className="hover:opacity-60 transition-opacity">
                    <Bookmark className="w-6 h-6 text-black" />
                  </button>
                </div>

                {/* 좋아요 수 */}
                {post.likes_count > 0 && (
                  <p className="font-semibold text-sm text-black mb-2">
                    좋아요 {post.likes_count.toLocaleString()}개
                  </p>
                )}

                {/* 캡션 */}
                {post.caption && (
                  <div className="mb-2">
                    <p className="text-sm text-black leading-relaxed">
                      <span className="font-semibold mr-2">{post.name}</span>
                      <span className="whitespace-pre-wrap">
                        {showFullCaption || post.caption.length <= 100
                          ? post.caption
                          : `${post.caption.slice(0, 100)}...`}
                      </span>
                    </p>
                    {post.caption.length > 100 && (
                      <button
                        onClick={() => setShowFullCaption(!showFullCaption)}
                        className="text-gray-500 text-sm hover:text-gray-700 transition-colors mt-1"
                      >
                        {showFullCaption ? "접기" : "... 더 보기"}
                      </button>
                    )}
                  </div>
                )}

                {/* 시간 표시 */}
                <p className="text-xs text-gray-500 uppercase mb-4">
                  {formatRelativeTime(post.created_at)}
                </p>
              </div>

              {/* 댓글 목록 */}
              <CommentList
                comments={comments}
                currentUserId={currentUser?.id}
                onDelete={handleCommentDelete}
                showDeleteButton={true}
              />
            </div>

            {/* 댓글 입력 폼 */}
            <div className="border-t border-gray-200 p-4">
              <CommentForm
                postId={post.post_id}
                onSubmit={handleComment}
                placeholder="댓글 달기..."
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
