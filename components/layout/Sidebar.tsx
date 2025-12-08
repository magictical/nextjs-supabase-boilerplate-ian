"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Home,
  Search,
  PlusSquare,
  User,
  Heart
} from "lucide-react";
import { cn } from "@/lib/supabase/utils";

/**
 * Instagram 클론 사이드바 컴포넌트
 *
 * 반응형 디자인:
 * - Desktop (≥1024px): 244px 너비, 아이콘 + 텍스트
 * - Tablet (768px~1023px): 72px 너비, 아이콘만
 * - Mobile: 숨김 (CSS로 처리)
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const menuItems = [
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
      href: user ? `/profile/${user.id}` : "/sign-in",
      active: pathname.startsWith("/profile"),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-border">
      {/* 로고 */}
      <div className="flex items-center justify-center lg:justify-start px-6 py-8 lg:px-8">
        <Link href="/" className="text-2xl font-bold">
          <span className="lg:hidden">📷</span>
          <span className="hidden lg:inline">Instagram</span>
        </Link>
      </div>

      {/* 메뉴 아이템들 */}
      <nav className="flex-1 px-3 lg:px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors hover:bg-gray-50 group",
                    "lg:justify-start",
                    isActive && "bg-gray-50 font-semibold"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6 flex-shrink-0",
                      isActive ? "text-black" : "text-gray-700"
                    )}
                  />
                  <span
                    className={cn(
                      "hidden lg:inline text-sm",
                      isActive ? "text-black" : "text-gray-700"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 사용자 프로필 (Desktop만) */}
      {user && (
        <div className="hidden lg:block p-4 border-t border-border">
          <Link
            href={`/profile/${user.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || user.username || "프로필"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.fullName || user.username || "사용자"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                @{user.username}
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
