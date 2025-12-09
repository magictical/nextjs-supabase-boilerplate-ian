"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { PostCard } from "@/components/post/PostCard";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";
import { PostModal } from "@/components/post/PostModal";
import { PostWithUser } from "@/lib/types";
import { handleFetchError, logError } from "@/lib/utils/error-handler";
import { Heart } from "lucide-react";

/**
 * 활동 페이지
 *
 * 좋아요 누른 게시물 리스트 표시
 * - 무한 스크롤 지원
 * - 게시물 상세 모달
 */
export default function ActivityPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(-1);
  const limit = 10;

  // 게시물 목록 조회
  const fetchLikedPosts = useCallback(
    async (currentOffset: number, append = false) => {
      if (isLoadingMore) return;

      try {
        setIsLoadingMore(true);

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: currentOffset.toString(),
        });

        let response: Response | null = null;
        try {
          response = await fetch(`/api/likes/user?${params}`);
        } catch (fetchErr) {
          const errorInfo = await handleFetchError(null, fetchErr);
          logError(errorInfo, "ActivityPage.fetchLikedPosts");
          setError(errorInfo.message);
          setIsLoadingMore(false);
          return;
        }

        if (!response.ok) {
          const errorInfo = await handleFetchError(response, null);
          logError(errorInfo, "ActivityPage.fetchLikedPosts");
          setError(errorInfo.message);
          setIsLoadingMore(false);
          return;
        }

        const data = await response.json();

        if (append) {
          setPosts((prev) => [...prev, ...data.data]);
        } else {
          setPosts(data.data);
        }

        setHasMore(data.pagination.hasMore);
        setOffset(currentOffset + data.data.length);
        setError(null);
      } catch (err) {
        const errorInfo = await handleFetchError(null, err);
        logError(errorInfo, "ActivityPage.fetchLikedPosts");
        setError(errorInfo.message);
        setHasMore(false);
      } finally {
        setIsLoadingMore(false);
        setIsLoading(false);
      }
    },
    [isLoadingMore]
  );

  // 초기 데이터 로드
  useEffect(() => {
    if (user) {
      fetchLikedPosts(0, false);
    }
  }, [user, fetchLikedPosts]);

  // 무한 스크롤
  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading) return;

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 1000
      ) {
        fetchLikedPosts(offset, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingMore, isLoading, offset, fetchLikedPosts]);

  // 게시물 상세 모달 열기
  const handleShowDetail = useCallback((postId: string) => {
    const index = posts.findIndex((p) => p.post_id === postId);
    setSelectedPostIndex(index);
    setSelectedPostId(postId);
  }, [posts]);

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setSelectedPostId(null);
    setSelectedPostIndex(-1);
  }, []);

  // 이전/다음 게시물
  const handlePrevious = useCallback(() => {
    if (selectedPostIndex > 0) {
      const prevPost = posts[selectedPostIndex - 1];
      setSelectedPostIndex(selectedPostIndex - 1);
      setSelectedPostId(prevPost.post_id);
    }
  }, [selectedPostIndex, posts]);

  const handleNext = useCallback(() => {
    if (selectedPostIndex < posts.length - 1) {
      const nextPost = posts[selectedPostIndex + 1];
      setSelectedPostIndex(selectedPostIndex + 1);
      setSelectedPostId(nextPost.post_id);
    }
  }, [selectedPostIndex, posts]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-[630px] mx-auto space-y-6">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-[630px] mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchLikedPosts(0, false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-[630px] mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-2 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            좋아요한 게시물
          </h1>
          <p className="text-gray-600 text-sm">
            내가 좋아요를 누른 게시물을 확인하세요
          </p>
        </div>

        {/* 게시물 목록 */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">좋아요한 게시물이 없습니다</p>
            <p className="text-sm text-gray-400">
              게시물에 좋아요를 눌러보세요
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, index) => (
              <PostCard
                key={post.post_id}
                post={post}
                currentUserId={user?.id}
                onShowDetail={handleShowDetail}
                index={index}
              />
            ))}

            {/* 더 로딩 중 */}
            {isLoadingMore && (
              <div className="py-8">
                <PostCardSkeleton />
              </div>
            )}

            {/* 더 이상 없음 */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                모든 게시물을 불러왔습니다
              </div>
            )}
          </div>
        )}

        {/* 게시물 상세 모달 */}
        {selectedPostId && (
          <PostModal
            postId={selectedPostId}
            isOpen={!!selectedPostId}
            onClose={handleCloseModal}
            onPrevious={selectedPostIndex > 0 ? handlePrevious : undefined}
            onNext={
              selectedPostIndex < posts.length - 1 ? handleNext : undefined
            }
            hasPrevious={selectedPostIndex > 0}
            hasNext={selectedPostIndex < posts.length - 1}
            currentUserId={user?.id}
          />
        )}
      </div>
    </div>
  );
}

