"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Search, User } from "lucide-react";
import Link from "next/link";
import { handleFetchError, logError } from "@/lib/utils/error-handler";

/**
 * 검색 페이지
 *
 * 사용자 아이디 검색 기능
 * - 검색어 입력
 * - 검색 결과 표시 (사용자 목록)
 * - 사용자 클릭 시 프로필 페이지로 이동
 */
export default function SearchPage() {
  const { isSignedIn } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색 실행
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response: Response | null = null;
      try {
        response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      } catch (fetchErr) {
        const errorInfo = await handleFetchError(null, fetchErr);
        logError(errorInfo, "SearchPage.handleSearch");
        setError(errorInfo.message);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorInfo = await handleFetchError(response, null);
        logError(errorInfo, "SearchPage.handleSearch");
        setError(errorInfo.message);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (err) {
      const errorInfo = await handleFetchError(null, err);
      logError(errorInfo, "SearchPage.handleSearch");
      setError(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 검색어 변경 시 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms 디바운스

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-[630px] mx-auto">
        {/* 검색 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-2">검색</h1>
          <p className="text-gray-600 text-sm">사용자 아이디 또는 이름으로 검색하세요</p>
        </div>

        {/* 검색 입력 */}
        <div className="relative mb-6">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="사용자 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="사용자 검색 입력"
          />
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}

        {/* 에러 상태 */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 검색 결과 */}
        {!isLoading && !error && (
          <div className="space-y-2">
            {searchResults.length === 0 && searchQuery ? (
              <div className="text-center py-12">
                <p className="text-gray-500">검색 결과가 없습니다.</p>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.clerk_id}`}
                  className="flex items-center gap-4 p-4 bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-black truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">@{user.clerk_id}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">검색어를 입력하세요</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

