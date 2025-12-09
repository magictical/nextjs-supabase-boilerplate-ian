/**
 * 로그인 페이지 전용 레이아웃
 *
 * 로그인 페이지에서는 Sidebar, Header, BottomNav를 숨기고
 * 전체 화면을 사용하여 로그인 UI를 표시합니다.
 */
export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* 네비게이션 없이 children만 렌더링 */}
      {children}
    </div>
  );
}

