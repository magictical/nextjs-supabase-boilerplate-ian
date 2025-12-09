"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { PostModal } from "./PostModal";
import { PostWithUser, PostsResponse } from "@/lib/types";
import { handleFetchError, logError } from "@/lib/utils/error-handler";
import { useToast } from "@/components/ui/toast";

/**
 * Instagram 클론 PostFeed 컴포넌트
 *
 * 게시물 목록 렌더링 및 무한 스크롤 구현
 * - Intersection Observer API 사용
 * - 하단 감지 요소 (sentinel) 추가
 * - 다음 페이지 자동 로드 (10개씩)
 * - 로딩 중 중복 요청 방지
 * - 에러 처리 및 재시도 기능
 */
interface PostFeedProps {
  initialPosts?: PostWithUser[];
  userId?: string; // 프로필 페이지용 필터
  currentUserId?: string; // 현재 로그인한 사용자 ID (삭제 기능용)
}

export function PostFeed({
  initialPosts = [],
  userId,
  currentUserId,
}: PostFeedProps) {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostWithUser[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(initialPosts.length);

  // 게시물 상세 모달 상태
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number>(-1);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const limit = 10;

  // 게시물 목록 조회 함수
  const fetchPosts = useCallback(
    async (currentOffset: number, append = false) => {
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: currentOffset.toString(),
        });

        if (userId) {
          params.append("userId", userId);
        }

        let response: Response | null = null;
        try {
          response = await fetch(`/api/posts?${params}`);
        } catch (fetchErr) {
          // 네트워크 에러 처리
          const errorInfo = await handleFetchError(null, fetchErr);
          logError(errorInfo, "PostFeed.fetchPosts");
          setError(errorInfo.message);
          setHasMore(false);
          return;
        }

        if (!response.ok) {
          const errorInfo = await handleFetchError(response, null);
          logError(errorInfo, "PostFeed.fetchPosts");
          setError(errorInfo.message);
          setHasMore(false);
          return;
        }

        const data: PostsResponse = await response.json();

        if (append) {
          setPosts((prev) => [...prev, ...data.data]);
        } else {
          setPosts(data.data);
        }

        setHasMore(data.pagination.hasMore);
        setOffset(currentOffset + data.data.length);
        setError(null);
      } catch (err) {
        // 예상치 못한 에러 처리
        const errorInfo = await handleFetchError(null, err);
        logError(errorInfo, "PostFeed.fetchPosts");
        setError(errorInfo.message);

        // 에러가 발생하면 더 이상 데이터를 로드하지 않음
        setHasMore(false);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [userId, limit],
  );

  // 초기 데이터 로드 (initialPosts가 없을 때)
  useEffect(() => {
    let isMounted = true;

    // 실제 API 호출
    if (initialPosts.length === 0 && !isLoading && !error && isMounted) {
      setIsLoading(true);
      fetchPosts(0, false).finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // Intersection Observer 설정
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isFetchingRef.current
        ) {
          setIsLoadingMore(true);
          fetchPosts(offset, true).finally(() => setIsLoadingMore(false));
        }
      },
      {
        rootMargin: "100px", // 100px 전에 로드 시작
        threshold: 0.1,
      },
    );

    observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [hasMore, isLoadingMore, offset, fetchPosts]);

  // 좋아요 추가 핸들러
  const handleLike = useCallback(async (postId: string) => {
    try {
      let response: Response | null = null;
      try {
        response = await fetch("/api/likes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ post_id: postId }),
        });
      } catch (fetchErr) {
        // 네트워크 에러 처리
        const errorInfo = await handleFetchError(null, fetchErr);
        logError(errorInfo, "PostFeed.handleLike");
        showToast(errorInfo.message, "error");
        return;
      }

      if (!response.ok) {
        const errorInfo = await handleFetchError(response, null);
        logError(errorInfo, "PostFeed.handleLike");
        showToast(errorInfo.message, "error");
        return;
      }

      await response.json();

      // 게시물 상태 업데이트
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.post_id === postId
            ? {
                ...post,
                isLiked: true,
                likes_count: post.likes_count + 1,
              }
            : post,
        ),
      );
    } catch (error) {
      // 예상치 못한 에러 처리
      const errorInfo = await handleFetchError(null, error);
      logError(errorInfo, "PostFeed.handleLike");
      showToast(errorInfo.message, "error");
    }
  }, [showToast]);

  // 좋아요 제거 핸들러
  const handleUnlike = useCallback(async (postId: string) => {
    try {
      let response: Response | null = null;
      try {
        response = await fetch("/api/likes", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ post_id: postId }),
        });
      } catch (fetchErr) {
        // 네트워크 에러 처리
        const errorInfo = await handleFetchError(null, fetchErr);
        logError(errorInfo, "PostFeed.handleUnlike");
        showToast(errorInfo.message, "error");
        return;
      }

      if (!response.ok) {
        const errorInfo = await handleFetchError(response, null);
        logError(errorInfo, "PostFeed.handleUnlike");
        showToast(errorInfo.message, "error");
        return;
      }

      await response.json();

      // 게시물 상태 업데이트
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.post_id === postId
            ? {
                ...post,
                isLiked: false,
                likes_count: post.likes_count - 1,
              }
            : post,
        ),
      );
    } catch (error) {
      // 예상치 못한 에러 처리
      const errorInfo = await handleFetchError(null, error);
      logError(errorInfo, "PostFeed.handleUnlike");
      showToast(errorInfo.message, "error");
    }
  }, [showToast]);

  // 게시물 삭제 핸들러
  const handleDelete = useCallback(
    async (postId: string) => {
      // 게시물 목록에서 즉시 제거 (낙관적 업데이트)
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.post_id !== postId),
      );

      // 선택된 게시물이 삭제된 경우 모달 닫기
      if (selectedPostId === postId) {
        setSelectedPostId(null);
        setSelectedPostIndex(-1);
      }
    },
    [selectedPostId],
  );

  // 댓글 작성 핸들러
  const handleComment = useCallback(async (postId: string, content: string) => {
    try {
      // Optimistic UI update
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.post_id === postId
            ? { ...p, comments_count: p.comments_count + 1 }
            : p,
        ),
      );

      let response: Response | null = null;
      try {
        response = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: postId, content }),
        });
      } catch (fetchErr) {
        // 네트워크 에러 처리
        const errorInfo = await handleFetchError(null, fetchErr);
        logError(errorInfo, "PostFeed.handleComment");

        // Rollback UI
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.post_id === postId
              ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
              : p,
          ),
        );

        showToast(errorInfo.message, "error");
        return;
      }

      if (!response.ok) {
        const errorInfo = await handleFetchError(response, null);
        logError(errorInfo, "PostFeed.handleComment");

        // Rollback UI
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.post_id === postId
              ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
              : p,
          ),
        );

        showToast(errorInfo.message, "error");
        return;
      }

      const newComment = await response.json();

      // 실제 댓글 목록 업데이트 (최신 댓글로 교체)
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.post_id === postId) {
            const updatedComments = [newComment, ...p.recentComments].slice(
              0,
              2,
            );
            return {
              ...p,
              recentComments: updatedComments,
            };
          }
          return p;
        }),
      );
    } catch (error) {
      // 예상치 못한 에러 처리
      const errorInfo = await handleFetchError(null, error);
      logError(errorInfo, "PostFeed.handleComment");

      // Rollback UI
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.post_id === postId
            ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
            : p,
        ),
      );

      showToast(errorInfo.message, "error");
    }
  }, [showToast]);

  // 댓글 삭제 핸들러
  const handleCommentDelete = useCallback(async (commentId: string) => {
    try {
      // Optimistic UI update
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.recentComments.some((c) => c.id === commentId)) {
            return {
              ...p,
              comments_count: Math.max(0, p.comments_count - 1),
              recentComments: p.recentComments.filter(
                (c) => c.id !== commentId,
              ),
            };
          }
          return p;
        }),
      );

      let response: Response | null = null;
      try {
        response = await fetch("/api/comments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment_id: commentId }),
        });
      } catch (fetchErr) {
        // 네트워크 에러 처리
        const errorInfo = await handleFetchError(null, fetchErr);
        logError(errorInfo, "PostFeed.handleCommentDelete");

        // Rollback UI
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.recentComments.length < 2) {
              return {
                ...p,
                comments_count: p.comments_count + 1,
              };
            }
            return p;
          }),
        );

        showToast(errorInfo.message, "error");
        return;
      }

      if (!response.ok) {
        const errorInfo = await handleFetchError(response, null);
        logError(errorInfo, "PostFeed.handleCommentDelete");

        // Rollback UI
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.recentComments.length < 2) {
              return {
                ...p,
                comments_count: p.comments_count + 1,
              };
            }
            return p;
          }),
        );

        showToast(errorInfo.message, "error");
        return;
      }
    } catch (error) {
      // 예상치 못한 에러 처리
      const errorInfo = await handleFetchError(null, error);
      logError(errorInfo, "PostFeed.handleCommentDelete");

      showToast(errorInfo.message, "error");

      // Rollback UI (댓글 수 증가 및 목록 복원 시도)
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.recentComments.length < 2) {
            // 최근 댓글 목록이 2개 미만이었을 때만 복원 시도
            return {
              ...p,
              comments_count: p.comments_count + 1,
              // 실제로는 삭제된 댓글을 다시 추가하기 어려우므로 카운트만 복원
            };
          }
          return p;
        }),
      );
    }
  }, []);

  // 모달 내 댓글 변경 핸들러 (PostFeed 상태 동기화용)
  const handleCommentChange = useCallback(
    (postId: string, commentsCount: number, newComment?: any) => {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.post_id === postId
            ? {
                ...p,
                comments_count: commentsCount,
                recentComments: newComment
                  ? [newComment, ...p.recentComments].slice(0, 2)
                  : p.recentComments,
              }
            : p,
        ),
      );
    },
    [],
  );

  // 모달 내 댓글 삭제 핸들러 (PostFeed 상태 동기화용)
  const handleCommentDeleteSync = useCallback(
    (postId: string, commentId: string, commentsCount: number) => {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.post_id === postId
            ? {
                ...p,
                comments_count: commentsCount,
                recentComments: p.recentComments.filter(
                  (c) => c.id !== commentId,
                ),
              }
            : p,
        ),
      );
    },
    [],
  );

  // 게시물 상세 보기 핸들러
  const handleShowDetail = useCallback(
    (postId: string) => {
      const postIndex = posts.findIndex((post) => post.post_id === postId);
      if (postIndex !== -1) {
        setSelectedPostId(postId);
        setSelectedPostIndex(postIndex);
      }
    },
    [posts],
  );

  // 모달 닫기 핸들러
  const handleCloseModal = useCallback(() => {
    setSelectedPostId(null);
    setSelectedPostIndex(-1);
  }, []);

  // 이전 게시물로 이동
  const handlePreviousPost = useCallback(() => {
    if (selectedPostIndex > 0) {
      const prevIndex = selectedPostIndex - 1;
      const prevPost = posts[prevIndex];
      setSelectedPostId(prevPost.post_id);
      setSelectedPostIndex(prevIndex);
    }
  }, [selectedPostIndex, posts]);

  // 다음 게시물로 이동
  const handleNextPost = useCallback(() => {
    if (selectedPostIndex < posts.length - 1) {
      const nextIndex = selectedPostIndex + 1;
      const nextPost = posts[nextIndex];
      setSelectedPostId(nextPost.post_id);
      setSelectedPostIndex(nextIndex);
    }
  }, [selectedPostIndex, posts]);

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    fetchPosts(0, false).finally(() => setIsLoading(false));
  }, [fetchPosts]);

  // 로딩 상태
  if (isLoading) {
    return <PostCardSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-2">
            게시물을 불러올 수 없습니다
          </p>
          <p className="text-gray-500 mb-4 text-sm">
            잠시 후 다시 시도해주세요
          </p>
          <p className="text-sm text-gray-400 mb-6 max-w-sm">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (posts.length === 0 && !hasMore) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            게시물이 없습니다
          </h3>
          <p className="text-gray-500">
            {userId
              ? "이 사용자의 게시물이 아직 없습니다"
              : "첫 번째 게시물을 작성해보세요"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 게시물 목록 */}
      {posts.map((post, index) => (
        <PostCard
          key={post.post_id}
          post={post}
          currentUserId={currentUserId}
          onLike={handleLike}
          onUnlike={handleUnlike}
          onComment={handleComment}
          onCommentDelete={handleCommentDelete}
          onShowDetail={handleShowDetail}
          onDelete={handleDelete}
          index={index}
        />
      ))}

      {/* 무한 스크롤 감지 요소 */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-sm">게시물을 불러오는 중...</span>
            </div>
          ) : (
            <div className="w-full max-w-xs">
              <PostCardSkeleton />
            </div>
          )}
        </div>
      )}

      {/* 더 이상 게시물이 없을 때 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            더 이상 표시할 게시물이 없습니다
          </p>
        </div>
      )}

      {/* 게시물 상세 모달 */}
      <PostModal
        postId={selectedPostId || ""}
        isOpen={selectedPostId !== null}
        onClose={handleCloseModal}
        onPrevious={handlePreviousPost}
        onNext={handleNextPost}
        hasPrevious={selectedPostIndex > 0}
        hasNext={selectedPostIndex < posts.length - 1}
        onCommentChange={handleCommentChange}
        onCommentDelete={handleCommentDeleteSync}
        currentUserId={currentUserId}
        onDelete={handleDelete}
      />
    </div>
  );
}
