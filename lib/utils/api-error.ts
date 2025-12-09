/**
 * API 라우트 에러 처리 유틸리티
 *
 * 서버 사이드에서 사용하는 에러 응답 헬퍼 함수
 * 일관된 에러 응답 형식 제공
 */

import { NextResponse } from "next/server";

/**
 * 표준 에러 응답 형식
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = { error: message };
  if (code) {
    response.code = code;
  }
  if (details) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * HTTP 상태 코드별 기본 에러 메시지
 */
const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: "잘못된 요청입니다.",
  401: "인증이 필요합니다.",
  403: "권한이 없습니다.",
  404: "요청한 리소스를 찾을 수 없습니다.",
  409: "이미 처리된 요청입니다.",
  500: "서버 오류가 발생했습니다.",
  502: "서버에 일시적인 문제가 발생했습니다.",
  503: "서비스를 일시적으로 사용할 수 없습니다.",
  504: "요청 시간이 초과되었습니다.",
};

/**
 * 상태 코드에 따른 기본 에러 응답 생성
 */
export function createErrorResponseByStatus(
  status: number,
  customMessage?: string,
): NextResponse<ApiErrorResponse> {
  const message =
    customMessage ||
    DEFAULT_ERROR_MESSAGES[status] ||
    "알 수 없는 오류가 발생했습니다.";
  return createErrorResponse(message, status);
}

/**
 * 인증 에러 응답
 */
export function createUnauthorizedResponse(
  message = "인증이 필요합니다.",
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 401, "UNAUTHORIZED");
}

/**
 * 권한 에러 응답
 */
export function createForbiddenResponse(
  message = "권한이 없습니다.",
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 403, "FORBIDDEN");
}

/**
 * 리소스 없음 에러 응답
 */
export function createNotFoundResponse(
  message = "요청한 리소스를 찾을 수 없습니다.",
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 404, "NOT_FOUND");
}

/**
 * 잘못된 요청 에러 응답
 */
export function createBadRequestResponse(
  message = "잘못된 요청입니다.",
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 400, "BAD_REQUEST");
}

/**
 * 서버 에러 응답
 */
export function createServerErrorResponse(
  message = "서버 오류가 발생했습니다.",
  error?: unknown,
): NextResponse<ApiErrorResponse> {
  // 개발 환경에서만 상세 에러 정보 포함
  const details = process.env.NODE_ENV === "development" ? error : undefined;
  return createErrorResponse(message, 500, "SERVER_ERROR", details);
}

