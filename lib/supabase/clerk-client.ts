"use client";

import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import { validateSupabaseEnv } from "./utils";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월부터 권장되는 방식:
 * - JWT 템플릿 불필요
 * - session.getToken()으로 현재 세션 토큰 사용
 * - React Hook으로 제공되어 Client Component에서 사용
 * - Clerk의 third-party auth provider 통합
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 *
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *
 *   async function fetchData() {
 *     const { data, error } = await supabase
 *       .from('table')
 *       .select('*')
 *       .order('created_at', { ascending: false });
 *
 *     if (error) throw error;
 *     return data;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { session } = useSession();

  const supabase = useMemo(() => {
    // 클라이언트에서 환경변수 직접 접근 (NEXT_PUBLIC_ 접두사 필요)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["']|["']$/g, '');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, '');

    if (!url || !anonKey) {
      throw new Error(
        `Missing Supabase environment variables.\n` +
        `NEXT_PUBLIC_SUPABASE_URL: ${url ? 'OK' : 'MISSING'}\n` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? 'OK' : 'MISSING'}\n\n` +
        `Please ensure:\n` +
        `1. .env file exists in project root\n` +
        `2. Variables are prefixed with NEXT_PUBLIC_\n` +
        `3. Development server was restarted`
      );
    }

    return createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      async accessToken() {
        // Clerk 세션 토큰을 Supabase에 전달
        // Supabase는 Clerk의 third-party auth provider로 설정되어 이 토큰을 검증
        return session?.getToken() ?? null;
      },
    });
  }, [session]);

  return supabase;
}
