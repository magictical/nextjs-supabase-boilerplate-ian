"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Heart, MessageCircle, User, Plus } from "lucide-react";

/**
 * Instagram 클론 모바일 헤더 컴포넌트
 *
 * Mobile 전용 (<768px)
 * - 높이: 60px
 * - 구성: Instagram 로고 + 우측 아이콘들 (알림, DM, 프로필)
 * - 배경: 흰색
 * - 하단 보더
 * - 고정 위치 (sticky top-0)
 */
export function Header() {
  const { user, isSignedIn } = useUser();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-border h-16">
      <div className="flex items-center justify-between h-full px-4">
        {/* 좌측: Instagram 로고 */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-black">
            Instagram
          </span>
        </Link>

        {/* 우측: 아이콘들 */}
        <div className="flex items-center space-x-4">
          {/* 만들기 버튼 */}
          <Link href="/create" className="p-1">
            <Plus className="w-6 h-6 text-black" />
          </Link>

          {/* 좋아요/활동 버튼 */}
          <Link href="/activity" className="p-1">
            <Heart className="w-6 h-6 text-black" />
          </Link>

          {/* DM 버튼 */}
          <Link href="/messages" className="p-1">
            <MessageCircle className="w-6 h-6 text-black" />
          </Link>

          {/* 프로필 버튼 */}
          {isSignedIn && user ? (
            <Link href={`/profile/${user.id}`} className="p-1">
              <div className="w-6 h-6 rounded-full bg-gray-300 overflow-hidden">
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
            </Link>
          ) : (
            <Link href="/sign-in" className="p-1">
              <User className="w-6 h-6 text-black" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
