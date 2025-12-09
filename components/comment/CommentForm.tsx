"use client";

import { useState, useRef, FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { User } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/supabase/utils";
import { useToast } from "@/components/ui/toast";

/**
 * 댓글 입력 폼 컴포넌트
 *
 * Instagram 스타일의 댓글 입력 폼을 제공합니다.
 * - 현재 사용자 프로필 이미지 표시
 * - 댓글 입력 필드
 * - "게시" 버튼 (입력 내용이 있을 때만 활성화)
 * - Enter 키로 제출 가능
 * - 로그인 상태 확인
 */
interface CommentFormProps {
  postId?: string; // 사용하지 않지만 타입 호환성을 위해 유지
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string; // 기본값: "댓글 달기..."
  className?: string;
}

export function CommentForm({
  postId,
  onSubmit,
  disabled = false,
  placeholder = "댓글 달기...",
  className,
}: CommentFormProps) {
  const { user, isSignedIn } = useUser();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSubmitting || disabled || !isSignedIn) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(content.trim());
      setContent(""); // 제출 후 입력창 초기화

      // textarea 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("댓글 제출 오류:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "댓글 작성에 실패했습니다. 다시 시도해주세요.";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // textarea 자동 높이 조절
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const canSubmit = content.trim().length > 0 && !isSubmitting && !disabled && isSignedIn;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex items-start space-x-3", className)}
    >
      {/* 프로필 이미지 */}
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        {user?.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={`${user.firstName || "사용자"} 프로필 이미지`}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>

      {/* 입력 필드 */}
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={isSignedIn ? placeholder : "댓글을 달려면 로그인이 필요합니다"}
          disabled={disabled || !isSignedIn}
          aria-label="댓글 입력"
          aria-describedby={isSignedIn ? undefined : "comment-login-required"}
          className={cn(
            "w-full px-0 py-1 text-sm bg-transparent border-none resize-none",
            "placeholder:text-gray-500 focus:outline-none focus:ring-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "max-h-20 overflow-y-auto" // 최대 높이 제한
          )}
          rows={1}
          style={{ height: "auto" }}
        />
        {!isSignedIn && (
          <span id="comment-login-required" className="sr-only">
            댓글을 작성하려면 로그인이 필요합니다
          </span>
        )}

        {/* 게시 버튼 */}
        {canSubmit && (
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "text-blue-500 text-sm font-semibold hover:text-blue-600",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              "mt-1"
            )}
          >
            {isSubmitting ? "게시 중..." : "게시"}
          </button>
        )}
      </div>
    </form>
  );
}
