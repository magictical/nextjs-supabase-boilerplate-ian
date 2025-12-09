"use client";

import React, { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { handleFetchError, logError } from "@/lib/utils/error-handler";

/**
 * Instagram 클론 게시물 작성 모달
 *
 * 기능:
 * - 이미지 선택 및 미리보기
 * - 캡션 입력 (최대 2,200자)
 * - Supabase Storage 업로드
 * - posts 테이블에 데이터 저장
 * - 진행 상태 표시
 */
interface CreatePostModalProps {
  children: React.ReactNode;
}

export function CreatePostModal({ children }: CreatePostModalProps) {
  const { user, isSignedIn } = useUser();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 상태 관리
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 검증
    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일만 선택할 수 있습니다.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      showToast("파일 크기는 5MB 이하여야 합니다.", "error");
      return;
    }

    setSelectedFile(file);

    // 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // 파일 제거
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 게시물 업로드
  const handleUpload = async () => {
    if (!selectedFile) return;

    // 인증 상태 확인
    if (!isSignedIn || !user) {
      showToast("로그인이 필요합니다.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Supabase Storage에 이미지 업로드
      setUploadProgress(20);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("caption", caption);
      formData.append("userId", user.id);

      let response: Response | null = null;
      try {
        response = await fetch("/api/posts", {
          method: "POST",
          body: formData,
        });
      } catch (fetchErr) {
        const errorInfo = await handleFetchError(null, fetchErr);
        logError(errorInfo, "CreatePostModal.handleUpload");
        throw new Error(errorInfo.message);
      }

      setUploadProgress(80);

      if (!response.ok) {
        const errorInfo = await handleFetchError(response, null);
        logError(errorInfo, "CreatePostModal.handleUpload");
        throw new Error(errorInfo.message);
      }

      await response.json();
      setUploadProgress(100);

      // 성공 처리
      showToast("게시물이 성공적으로 업로드되었습니다!", "success");

      // 게시물 생성 후 페이지 새로고침
      window.location.reload();

      // 모달 초기화
      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "업로드에 실패했습니다.";
      logError(
        {
          type: "UNKNOWN_ERROR",
          message: errorMessage,
          originalError: error,
        },
        "CreatePostModal.handleUpload",
      );
      showToast(errorMessage, "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 모달 트리거 클릭 핸들러
  const handleTriggerClick = (e: React.MouseEvent) => {
    if (!isSignedIn || !user) {
      e.preventDefault();
      showToast("게시물을 작성하려면 로그인이 필요합니다.", "error");
      return;
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 진행률 표시 컴포넌트
  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {React.cloneElement(children as React.ReactElement<any>, {
          onClick: handleTriggerClick,
        })}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-center">새 게시물 만들기</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* 파일 선택 영역 */}
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">사진과 동영상을 선택하세요</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                aria-label="이미지 파일 선택"
                className="bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                컴퓨터에서 선택
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            /* 이미지 미리보기 및 캡션 입력 */
            <div className="space-y-4">
              {/* 이미지 미리보기 */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {previewUrl && (
                  <>
                    <Image
                      src={previewUrl}
                      alt="업로드할 이미지"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={handleRemoveFile}
                      aria-label="이미지 제거"
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* 캡션 입력 */}
              <div>
                <Textarea
                  placeholder="문구 입력..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                  rows={3}
                  className="resize-none"
                  aria-label="게시물 캡션 입력"
                  aria-describedby="caption-counter"
                />
                <p
                  id="caption-counter"
                  className="text-xs text-gray-500 mt-1 text-right"
                  aria-live="polite"
                >
                  {caption.length}/2,200
                </p>
              </div>

              {/* 업로드 진행률 */}
              {isUploading && <ProgressBar progress={uploadProgress} />}

              {/* 액션 버튼들 */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isUploading}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    "공유하기"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
