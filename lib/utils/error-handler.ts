/**
 * 공통 에러 처리 유틸리티
 *
 * API 에러 타입 분류 및 사용자 친화적 메시지 매핑
 * 네트워크 에러 감지 및 처리
 * 에러 로깅 유틸리티
 */

/**
 * 에러 타입 정의
 */
export type ErrorType =
  | "BAD_REQUEST" // 400
  | "UNAUTHORIZED" // 401
  | "FORBIDDEN" // 403
  | "NOT_FOUND" // 404
  | "CONFLICT" // 409
  | "SERVER_ERROR" // 500
  | "NETWORK_ERROR" // 네트워크 연결 실패
  | "UNKNOWN_ERROR"; // 알 수 없는 오류

/**
 * 에러 정보 인터페이스
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  statusCode?: number;
  originalError?: unknown;
}

/**
 * HTTP 상태 코드를 에러 타입으로 변환
 */
export function getErrorTypeFromStatusCode(statusCode: number): ErrorType {
  switch (statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 500:
    case 502:
    case 503:
    case 504:
      return "SERVER_ERROR";
    default:
      return "UNKNOWN_ERROR";
  }
}

/**
 * 에러 타입별 사용자 친화적 메시지 매핑
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  BAD_REQUEST: "잘못된 요청입니다. 입력한 정보를 확인해주세요.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "이 작업을 수행할 권한이 없습니다.",
  NOT_FOUND: "요청한 리소스를 찾을 수 없습니다.",
  CONFLICT: "이미 처리된 요청입니다.",
  SERVER_ERROR: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  NETWORK_ERROR: "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.",
  UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

/**
 * 에러 타입에 따른 사용자 친화적 메시지 반환
 */
export function getUserFriendlyMessage(errorType: ErrorType): string {
  return ERROR_MESSAGES[errorType];
}

/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }
  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("Network") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    );
  }
  return false;
}

/**
 * fetch 에러를 처리하고 ErrorInfo 반환
 */
export async function handleFetchError(
  response: Response | null,
  error: unknown,
): Promise<ErrorInfo> {
  // 네트워크 에러인 경우
  if (isNetworkError(error) || !response) {
    return {
      type: "NETWORK_ERROR",
      message: getUserFriendlyMessage("NETWORK_ERROR"),
      originalError: error,
    };
  }

  // HTTP 응답이 있는 경우
  if (response) {
    const errorType = getErrorTypeFromStatusCode(response.status);
    let message = getUserFriendlyMessage(errorType);

    // 응답 본문에서 에러 메시지 추출 시도
    try {
      const data = await response.json();
      if (data.error && typeof data.error === "string") {
        message = data.error;
      }
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }

    return {
      type: errorType,
      message,
      statusCode: response.status,
      originalError: error,
    };
  }

  // 알 수 없는 에러
  return {
    type: "UNKNOWN_ERROR",
    message: getUserFriendlyMessage("UNKNOWN_ERROR"),
    originalError: error,
  };
}

/**
 * 에러 로깅 (개발 환경에서만 상세 로그)
 */
export function logError(errorInfo: ErrorInfo, context?: string): void {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    console.group(`[Error] ${errorInfo.type}${context ? ` - ${context}` : ""}`);
    console.error("Message:", errorInfo.message);
    if (errorInfo.statusCode) {
      console.error("Status Code:", errorInfo.statusCode);
    }
    if (errorInfo.originalError) {
      console.error("Original Error:", errorInfo.originalError);
    }
    console.groupEnd();
  } else {
    // 프로덕션에서는 간단한 로그만
    console.error(`[Error] ${errorInfo.type}: ${errorInfo.message}`);
  }
}

/**
 * API 응답에서 에러 정보 추출
 */
export async function extractErrorFromResponse(
  response: Response,
): Promise<ErrorInfo> {
  const errorType = getErrorTypeFromStatusCode(response.status);
  let message = getUserFriendlyMessage(errorType);

  try {
    const data = await response.json();
    if (data.error && typeof data.error === "string") {
      message = data.error;
    }
  } catch {
    // JSON 파싱 실패 시 기본 메시지 사용
  }

  return {
    type: errorType,
    message,
    statusCode: response.status,
  };
}


