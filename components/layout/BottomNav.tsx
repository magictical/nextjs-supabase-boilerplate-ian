"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { cn } from "@/lib/supabase/utils";
import { CreatePostModal } from "@/components/post/CreatePostModal";

/**
 * Instagram 클론 모바일 하단 네비게이션 컴포넌트
 *
 * Mobile 전용 (<768px)
 * - 높이: 50px
 * - 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 * - 고정 위치 (fixed bottom-0)
 * - 배경: 흰색
 * - 상단 보더
 * - 아이콘 중앙 정렬, 균등 분배
 */
export function BottomNav() {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const navItems = [
    {
      icon: Home,
      label: "홈",
      href: "/",
      active: pathname === "/",
    },
    {
      icon: Search,
      label: "검색",
      href: "/search",
      active: pathname === "/search",
      disabled: true, // 1차 MVP 제외
    },
    {
      icon: PlusSquare,
      label: "만들기",
      href: "/create",
      active: pathname === "/create",
      modal: true,
    },
    {
      icon: Heart,
      label: "활동",
      href: "/activity",
      active: pathname === "/activity",
      disabled: true, // 1차 MVP 제외
    },
    {
      icon: User,
      label: isSignedIn ? "프로필" : "로그인",
      href: isSignedIn && user ? `/profile/${user.id}` : "/sign-in",
      active: pathname.startsWith("/profile") || pathname === "/sign-in",
      disabled: isSignedIn, // 로그인한 경우에만 disabled (프로필 기능 미구현)
    },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border h-12">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          // "만들기" 버튼은 모달로 감싸기
          if ("modal" in item && item.modal) {
            const modalNavItem = (
              <button
                className={cn(
                  "flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-0 flex-1",
                  isActive ? "text-black" : "text-gray-600",
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 mb-0.5",
                    isActive ? "text-black" : "text-gray-600",
                  )}
                />
                <span
                  className={cn(
                    "text-xs leading-none",
                    isActive ? "text-black font-medium" : "text-gray-600",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );

            return <CreatePostModal key={item.href}>{modalNavItem}</CreatePostModal>;
          }

          // disabled된 버튼들은 클릭 시 메시지 표시 (프로필 제외)
          if ("disabled" in item && item.disabled) {
            // 프로필 버튼은 로그아웃 기능 추가
            if (item.label === "프로필") {
              const profileNavItem = (
                <div
                  key={item.href}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (confirm("로그아웃하시겠습니까?")) {
                      signOut({ redirectUrl: "/" });
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-0 flex-1",
                    isActive ? "text-black" : "text-gray-400",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6 mb-0.5",
                      isActive ? "text-black" : "text-gray-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs leading-none",
                      isActive ? "text-black font-medium" : "text-gray-400",
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              );

              return profileNavItem;
            }

            // 다른 disabled 버튼들
            const disabledNavItem = (
              <button
                key={item.href}
                onClick={() => alert(`${item.label} 기능은 2차 개발에서 제공될 예정입니다.`)}
                className={cn(
                  "flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-0 flex-1 opacity-60 cursor-not-allowed",
                  isActive ? "text-black" : "text-gray-400",
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 mb-0.5",
                    isActive ? "text-black" : "text-gray-400",
                  )}
                />
                <span
                  className={cn(
                    "text-xs leading-none",
                    isActive ? "text-black font-medium" : "text-gray-400",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );

            return disabledNavItem;
          }

          // 나머지 버튼들은 Link로 처리
          const linkNavItem = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-0 flex-1",
                isActive ? "text-black" : "text-gray-600",
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 mb-0.5",
                  isActive ? "text-black" : "text-gray-600",
                )}
              />
              <span
                className={cn(
                  "text-xs leading-none",
                  isActive ? "text-black font-medium" : "text-gray-600",
                )}
              >
                {item.label}
              </span>
            </Link>
          );

          return linkNavItem;
        })}
      </div>
    </nav>
  );
}
