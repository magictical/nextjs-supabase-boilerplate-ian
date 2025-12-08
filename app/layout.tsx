import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

// Clerk 한국어 로컬라이제이션 커스터마이징
const koreanLocalization = {
  ...koKR,
  // 에러 메시지 한국어화
  unstable__errors: {
    ...koKR.unstable__errors,
    not_allowed_access: "이메일 도메인이 허용되지 않습니다. 관리자에게 문의해주세요.",
    form_password_incorrect: "비밀번호가 올바르지 않습니다.",
    form_username_invalid_character: "사용자 이름에 허용되지 않는 문자가 포함되어 있습니다.",
    form_email_invalid: "올바른 이메일 주소를 입력해주세요.",
    form_password_length_too_short: "비밀번호는 최소 8자 이상이어야 합니다.",
    form_password_pwned: "이 비밀번호는 보안 문제가 발견되어 사용할 수 없습니다.",
    form_password_not_strong_enough: "비밀번호가 너무 약합니다. 대문자, 소문자, 숫자, 특수문자를 포함해주세요.",
    identifier_not_found: "등록되지 않은 사용자입니다.",
    form_param_format_invalid: "입력 형식이 올바르지 않습니다.",
    form_param_nil: "필수 입력 항목입니다.",
  },
  // 추가적인 한국어 텍스트 커스터마이징
  signIn: {
    ...koKR.signIn,
    start: {
      ...koKR.signIn?.start,
      title: "로그인",
      subtitle: "{{applicationName}}에 로그인하세요",
    },
    emailCode: {
      ...koKR.signIn?.emailCode,
      title: "이메일 확인",
      subtitle: "로그인을 위해 이메일로 전송된 코드를 입력해주세요",
    },
  },
  signUp: {
    ...koKR.signUp,
    start: {
      ...koKR.signUp?.start,
      title: "회원가입",
      subtitle: "{{applicationName}}에 가입하세요",
    },
    emailCode: {
      ...koKR.signUp?.emailCode,
      title: "이메일 확인",
      subtitle: "회원가입을 위해 이메일로 전송된 코드를 입력해주세요",
    },
  },
  userProfile: {
    ...koKR.userProfile,
    profilePage: {
      ...koKR.userProfile?.profilePage,
      title: "프로필 관리",
    },
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaaS 템플릿",
  description: "Next.js + Clerk + Supabase 보일러플레이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koreanLocalization}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>
            <Navbar />
            {children}
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
