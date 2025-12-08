import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clerk + Supabase 환경변수 검증
 * 
 * 클라이언트 컴포넌트에서 사용 시 주의:
 * - NEXT_PUBLIC_ 접두사가 있는 환경변수만 클라이언트에서 접근 가능
 * - 개발 서버 재시작 후 환경변수 변경사항이 반영됨
 */
export function validateSupabaseEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  // 환경변수 값 확인 (빈 문자열도 체크)
  const missing = required.filter(key => {
    const value = process.env[key];
    return !value || value.trim() === '';
  });

  if (missing.length > 0) {
    // 디버깅을 위한 상세 정보
    const envInfo = required.map(key => {
      const value = process.env[key];
      return `${key}=${value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'undefined'}`;
    }).join('\n');

    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}\n\n` +
      `Current environment variables:\n${envInfo}\n\n` +
      `Please check:\n` +
      `1. .env file exists in project root\n` +
      `2. Variables start with NEXT_PUBLIC_ prefix\n` +
      `3. Development server was restarted after .env changes\n` +
      `4. No quotes around values in .env file`
    );
  }

  // 값에서 따옴표 제거 (혹시 .env에 따옴표가 포함된 경우)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().replace(/^["']|["']$/g, '');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim().replace(/^["']|["']$/g, '');

  return {
    url,
    anonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, ''),
  };
}

/**
 * Clerk 환경변수 검증
 */
export function validateClerkEnv() {
  const required = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Clerk environment variables: ${missing.join(', ')}`
    );
  }

  return {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    secretKey: process.env.CLERK_SECRET_KEY!,
  };
}
