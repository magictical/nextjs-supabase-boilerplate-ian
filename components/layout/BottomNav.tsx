"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { cn } from "@/lib/supabase/utils";

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
    },
    {
      icon: PlusSquare,
      label: "만들기",
      href: "/create",
      active: pathname === "/create",
    },
    {
      icon: Heart,
      label: "활동",
      href: "/activity",
      active: pathname === "/activity",
    },
    {
      icon: User,
      label: "프로필",
      href: isSignedIn && user ? `/profile/${user.id}` : "/sign-in",
      active: pathname.startsWith("/profile") || pathname === "/sign-in",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border h-12">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-0 flex-1",
                isActive ? "text-black" : "text-gray-600"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 mb-0.5",
                  isActive ? "text-black" : "text-gray-600"
                )}
              />
              <span
                className={cn(
                  "text-xs leading-none",
                  isActive ? "text-black font-medium" : "text-gray-600"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
