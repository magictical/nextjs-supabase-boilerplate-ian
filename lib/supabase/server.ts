import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { validateSupabaseEnv } from "./utils";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Server Component/Server Action용)
 *
 * 2025년 4월부터 권장되는 방식:
 * - JWT 템플릿 불필요
 * - Clerk의 third-party auth provider 통합
 * - auth().getToken()으로 현재 세션 토큰 사용
 * - Server Component, Server Action, API Routes에서 사용
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = createClerkSupabaseClient();
 *   const { data, error } = await supabase
 *     .from('table')
 *     .select('*')
 *     .order('created_at', { ascending: false });
 *
 *   if (error) throw error;
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example
 * ```ts
 * // Server Action
 * 'use server';
 *
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export async function createItem(name: string) {
 *   const supabase = createClerkSupabaseClient();
 *   const { data, error } = await supabase
 *     .from('items')
 *     .insert({ name, user_id: (await auth()).userId });
 *
 *   if (error) throw error;
 *   return data;
 * }
 * ```
 */
export function createClerkSupabaseClient() {
  const { url, anonKey } = validateSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false, // 서버 사이드에서는 토큰 자동 갱신 불필요
      persistSession: false,   // 서버 사이드에서는 세션 유지 불필요
    },
    async accessToken() {
      // Clerk 세션 토큰을 Supabase에 전달
      // Supabase는 Clerk의 third-party auth provider로 설정되어 이 토큰을 검증
      return (await auth()).getToken();
    },
  });
}
