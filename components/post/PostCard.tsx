"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { PostWithUser } from "@/lib/types";
import { LikeButton } from "./LikeButton";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import { PostMenu } from "./PostMenu";

/**
 * Instagram 클론 PostCard 컴포넌트
 *
 * PRD의 PostCard 디자인 구현:
 * - 헤더 (프로필 이미지 32px, 사용자명, 시간, ⋯ 메뉴)
 * - 이미지 영역 (1:1 정사각형, Next.js Image 최적화)
 * - 액션 버튼 (좋아요, 댓글, 공유, 북마크)
 * - 좋아요 수 표시
 * - 캡션 (사용자명 Bold + 내용, 2줄 초과 시 "... 더 보기")
 * - 댓글 미리보기 (최신 2개)
 * - 댓글 입력창
 */
interface PostCardProps {
  post: PostWithUser;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onCommentDelete?: (commentId: string) => void;
  onShowDetail?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onUnlike,
  onComment,
  onCommentDelete,
  onShowDetail,
  onDelete,
}: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isDoubleTapped, setIsDoubleTapped] = useState(false);

  // 좋아요 상태 관리 (실시간 업데이트용)
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.isLiked);

  // 더블 탭 감지 및 좋아요 토글
  const [lastTap, setLastTap] = useState(0);
  const handleImageClick = () => {
    const currentTime = new Date().getTime();
    const tapGap = currentTime - lastTap;

    if (tapGap < 300 && tapGap > 0) {
      // 더블 탭 감지
      setIsDoubleTapped(true);
      setTimeout(() => setIsDoubleTapped(false), 1000);

      // 좋아요 토글 (로컬 상태 업데이트)
      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);

      // 부모 컴포넌트에도 알림 (선택사항)
      if (newIsLiked && onLike) {
        onLike(post.post_id);
      } else if (!newIsLiked && onUnlike) {
        onUnlike(post.post_id);
      }
    }

    setLastTap(currentTime);
  };

  // LikeButton의 좋아요 변경 핸들러
  const handleLikeChange = (newLikesCount: number, newIsLiked: boolean) => {
    setLikesCount(newLikesCount);
    setIsLiked(newIsLiked);
  };

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

  // 캡션 텍스트 처리
  const shouldShowMoreButton = post.caption && post.caption.length > 100;
  const displayCaption = showFullCaption || !shouldShowMoreButton
    ? post.caption
    : `${post.caption.slice(0, 100)}...`;

  // 댓글 제출 (CommentForm에서 호출)
  const handleComment = async (content: string) => {
    if (onComment) {
      await onComment(post.post_id, content);
    }
  };

  return (
    <article className="bg-white border border-border rounded-lg overflow-hidden">
      {/* 헤더 (60px 높이) */}
      <header className="flex items-center justify-between p-4">
        <Link
          href={`/profile/${post.clerk_id}`}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
            {/* 프로필 이미지 (Clerk 연동 시 구현) */}
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

        <div className="flex items-center space-x-2">
          <time className="text-xs text-gray-500">
            {formatRelativeTime(post.created_at)}
          </time>
          <PostMenu
            postId={post.post_id}
            isOwner={currentUserId === post.user_id}
            onDelete={onDelete}
          />
        </div>
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div
        className="aspect-square bg-gray-100 relative cursor-pointer"
        onClick={handleImageClick}
      >
        <Image
          src={post.image_url}
          alt={`게시물 이미지 - ${post.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}
        />

        {/* 더블 탭 좋아요 애니메이션 */}
        {isDoubleTapped && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart className="w-24 h-24 text-white fill-red-500 animate-ping" />
          </div>
        )}
      </div>

      {/* 액션 버튼 (48px 높이) */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <LikeButton
            postId={post.post_id}
            isLiked={isLiked}
            likesCount={likesCount}
            onLikeChange={handleLikeChange}
          />

          <button
            onClick={() => onShowDetail?.(post.post_id)}
            className="hover:opacity-60 transition-opacity"
          >
            <MessageCircle className="w-6 h-6 text-black" />
          </button>

          <button className="hover:opacity-60 transition-opacity">
            <Send className="w-6 h-6 text-black" />
          </button>
        </div>

        <button className="hover:opacity-60 transition-opacity">
          <Bookmark className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4">
        {/* 좋아요 수 */}
        <div className="mb-2">
          <p className="font-semibold text-sm text-black">
            좋아요 {likesCount.toLocaleString()}개
          </p>
        </div>

        {/* 캡션 */}
        {post.caption && (
          <div className="mb-3">
            <p className="text-sm text-black leading-relaxed">
              <span className="font-semibold">{post.name}</span>{" "}
              <span className="whitespace-pre-wrap">{displayCaption}</span>
            </p>
            {shouldShowMoreButton && (
              <button
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                {showFullCaption ? "접기" : "... 더 보기"}
              </button>
            )}
          </div>
        )}

        {/* 댓글 미리보기 */}
        {post.comments_count > 0 && (
          <div className="mb-3">
            <button
              onClick={() => onShowDetail?.(post.post_id)}
              className="text-gray-500 text-sm hover:text-gray-700 transition-colors mb-2 block"
            >
              댓글 {post.comments_count}개 모두 보기
            </button>

            <CommentList
              comments={post.recentComments}
              currentUserId={currentUserId}
              maxComments={2}
              onDelete={onCommentDelete}
            />
          </div>
        )}

        {/* 댓글 입력창 */}
        <div className="pt-3 border-t border-border">
          <CommentForm
            postId={post.post_id}
            onSubmit={handleComment}
            placeholder="댓글 달기..."
          />
        </div>
      </div>
    </article>
  );
}




