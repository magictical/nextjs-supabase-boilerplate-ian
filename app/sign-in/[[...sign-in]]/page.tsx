import { SignIn } from "@clerk/nextjs";

/**
 * Instagram 클론 로그인 페이지
 *
 * Clerk의 SignIn 컴포넌트를 사용하여 로그인 UI 제공
 * - catch-all 라우트 (`[[...sign-in]]`) 사용으로 Clerk의 모든 서브 라우트 처리
 * - 한국어 로컬라이제이션은 app/layout.tsx의 ClerkProvider에서 자동 적용
 * - 로그인 성공 시 홈 페이지로 리다이렉트
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none border border-gray-200 bg-white",
              headerTitle: "text-2xl font-bold text-black",
              headerSubtitle: "text-gray-600",
              socialButtonsBlockButton:
                "bg-white border border-gray-300 text-black hover:bg-gray-50",
              formButtonPrimary:
                "bg-blue-500 hover:bg-blue-600 text-white font-semibold",
              formFieldInput:
                "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
              footerActionLink: "text-blue-500 hover:text-blue-600",
              identityPreviewText: "text-gray-700",
              identityPreviewEditButton: "text-blue-500 hover:text-blue-600",
            },
          }}
          routing="path"
          path="/sign-in"
          redirectUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}

