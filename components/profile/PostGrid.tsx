"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { PostThumbnail } from "@/lib/types";

/**
 * 프로필 페이지 게시물 그리드 컴포넌트
 *
 * Instagram-like 3열 그리드 레이아웃
 * - 1:1 정사각형 썸네일
 * - Hover 시 좋아요/댓글 수 오버레이
 * - 클릭 시 게시물 상세 모달 열기
 */

interface PostGridProps {
  userId: string; // Supabase user_id (UUID)
  onPostClick?: (postId: string) => void; // 게시물 클릭 핸들러
}

export function PostGrid({ userId, onPostClick }: PostGridProps) {
  const [posts, setPosts] = useState<PostThumbnail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false); // 더보기 기능은 추후 구현

  // 게시물 목록 로드
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: "12", // 초기 12개 표시
        offset: "0",
        userId: userId, // 특정 사용자의 게시물만
      });

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) {
        throw new Error("게시물을 불러올 수 없습니다.");
      }

      const data = await response.json();
      console.log("PostGrid API response:", data); // 디버깅용
      
      // API 응답 형식: { data: PostWithUser[], pagination: {...} }
      const postsData = data.data || [];
      
      // PostWithUser를 PostThumbnail로 변환
      const thumbnails: PostThumbnail[] = postsData.map((post: any) => ({
        post_id: post.post_id,
        image_url: post.image_url,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
      }));
      
      setPosts(thumbnails);
      setHasMore(data.pagination?.hasMore || false);
    } catch (err) {
      console.error("PostGrid load error:", err);
      setError(err instanceof Error ? err.message : "게시물을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // userId 변경 시 게시물 다시 로드
  useEffect(() => {
    if (userId) {
      loadPosts();
    }
  }, [userId, loadPosts]);

  // 게시물 클릭 핸들러
  const handlePostClick = (postId: string) => {
    if (onPostClick) {
      onPostClick(postId);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">게시물을 불러올 수 없습니다</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={loadPosts}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 게시물이 없는 경우
  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">게시물이 없습니다</p>
          <p className="text-sm text-gray-500">첫 번째 게시물을 공유해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {posts.map((post) => (
        <div
          key={post.post_id}
          className="aspect-square relative group cursor-pointer overflow-hidden"
          onClick={() => handlePostClick(post.post_id)}
        >
          {/* 게시물 이미지 */}
          <Image
            src={post.image_url}
            alt={`게시물 썸네일`}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, 33vw"
          />

          {/* Hover 오버레이 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
            <div className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="font-semibold">{post.likes_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="font-semibold">{post.comments_count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
