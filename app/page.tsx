/**
 * Instagram 클론 홈 피드 페이지
 *
 * 게시물 목록을 표시하는 메인 피드
 * 아직 PostCard 컴포넌트가 구현되지 않아 임시 콘텐츠 표시
 */
export default function HomePage() {
  return (
    <>
      {/* Stories 섹션 (임시) */}
      <div className="border-b border-border bg-white p-4 mb-4">
        <div className="flex space-x-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center space-y-1 flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-300"></div>
                </div>
              </div>
              <span className="text-xs text-center">스토리 {i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 게시물 피드 (임시) */}
      <div className="space-y-6 pb-16 md:pb-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white border border-border rounded-lg overflow-hidden"
          >
            {/* 게시물 헤더 */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                <div>
                  <p className="font-semibold text-sm">사용자 {i}</p>
                  <p className="text-xs text-gray-500">3시간 전</p>
                </div>
              </div>
              <button className="text-gray-500">⋯</button>
            </div>

            {/* 게시물 이미지 */}
            <div className="aspect-square bg-gray-200 flex items-center justify-center">
              <div className="w-32 h-32 bg-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-gray-600">이미지 {i}</span>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <button className="text-2xl">❤️</button>
                <button className="text-2xl">💬</button>
                <button className="text-2xl">📤</button>
              </div>
              <button className="text-2xl">🔖</button>
            </div>

            {/* 좋아요 수 */}
            <div className="px-4 pb-2">
              <p className="font-semibold text-sm">좋아요 1,234개</p>
            </div>

            {/* 캡션 */}
            <div className="px-4 pb-4">
              <p className="text-sm">
                <span className="font-semibold">사용자 {i}</span> 이곳은 게시물
                캡션입니다. Instagram 클론의 게시물 카드 컴포넌트가 곧 구현될
                예정입니다.
              </p>
              <button className="text-gray-500 text-sm mt-1">더 보기</button>
            </div>

            {/* 댓글 미리보기 */}
            <div className="px-4 pb-4 border-b border-border">
              <p className="text-sm text-gray-500">댓글 15개 모두 보기</p>
              <div className="space-y-1 mt-2">
                <p className="text-sm">
                  <span className="font-semibold">댓글러1</span> 멋진
                  사진이네요!
                </p>
                <p className="text-sm">
                  <span className="font-semibold">댓글러2</span> 좋아요 👍
                </p>
              </div>
            </div>

            {/* 댓글 입력 */}
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="댓글 달기..."
                    className="w-full text-sm border-none outline-none bg-transparent"
                  />
                </div>
                <button className="text-blue-500 font-semibold text-sm">
                  게시
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
