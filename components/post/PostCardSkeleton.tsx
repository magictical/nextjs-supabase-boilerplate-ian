/**
 * Instagram 클론 PostCard 로딩 스켈레톤 컴포넌트
 *
 * 로딩 UI (Instagram 스타일 Skeleton + Shimmer 효과)
 * - 헤더: 원형 프로필 + 텍스트 박스
 * - 이미지: 정사각형 회색 박스
 * - 액션 버튼: 작은 박스들
 * - 컨텐츠: 여러 줄 텍스트 박스
 * - 반복 렌더링: 3-5개 Skeleton 표시
 */

/**
 * 단일 PostCard 스켈레톤 아이템
 */
function PostCardSkeletonItem() {
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* 헤더 (60px 높이) */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {/* 프로필 이미지 */}
          <div className="w-8 h-8 bg-gray-300 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
          {/* 사용자명 */}
          <div className="h-4 bg-gray-300 rounded w-20 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
        </div>
        {/* 메뉴 버튼 */}
        <div className="w-6 h-6 bg-gray-300 rounded relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer"></div>
        </div>
      </div>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div className="aspect-square bg-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer"></div>
      </div>

      {/* 액션 버튼 (48px 높이) */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          {/* 좋아요, 댓글, 공유 버튼 */}
          <div className="w-6 h-6 bg-gray-300 rounded relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
          <div className="w-6 h-6 bg-gray-300 rounded relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
          <div className="w-6 h-6 bg-gray-300 rounded relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
        </div>
        {/* 북마크 버튼 */}
        <div className="w-6 h-6 bg-gray-300 rounded relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer"></div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4 space-y-3">
        {/* 좋아요 수 */}
        <div className="h-4 bg-gray-300 rounded w-24 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer"></div>
        </div>

        {/* 캡션 (2줄) */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-full relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-3/4 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
        </div>

        {/* "더 보기" 버튼 */}
        <div className="h-3 bg-gray-300 rounded w-16 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer"></div>
        </div>

        {/* 댓글 미리보기 */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="h-3 bg-gray-300 rounded w-32 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
          <div className="space-y-1">
            <div className="h-4 bg-gray-300 rounded w-full relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer"></div>
            </div>
            <div className="h-4 bg-gray-300 rounded w-5/6 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* 댓글 입력 영역 */}
        <div className="flex items-center space-x-3 pt-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
          <div className="flex-1 h-8 bg-gray-200 rounded relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-12 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PostCardSkeleton 컴포넌트
 * 여러 개의 스켈레톤 아이템을 표시
 */
export function PostCardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 3-5개의 스켈레톤 아이템 표시 */}
      {[1, 2, 3, 4].map((i) => (
        <PostCardSkeletonItem key={i} />
      ))}
    </div>
  );
}




