// ============================================
// Instagram Clone - TypeScript 타입 정의
// 데이터베이스 테이블 구조 기반 타입들
// ============================================

// ============================================
// 기본 타입들
// ============================================

/** 타임스탬프 타입 (Supabase에서 사용하는 형식) */
export type Timestamp = string;

/** UUID 타입 */
export type UUID = string;

/** Clerk User ID 타입 */
export type ClerkUserId = string;

// ============================================
// User 관련 타입들
// ============================================

/** 사용자 기본 정보 */
export interface User {
  id: UUID;
  clerk_id: ClerkUserId;
  name: string;
  created_at: Timestamp;
}

/** 사용자 생성 시 필요한 데이터 */
export interface CreateUserData {
  clerk_id: ClerkUserId;
  name: string;
}

/** 사용자 업데이트 데이터 */
export interface UpdateUserData {
  name?: string;
}

/** 사용자 통계 정보 (뷰에서 사용하는 타입) */
export interface UserStats {
  user_id: UUID;
  clerk_id: ClerkUserId;
  name: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

// ============================================
// Post 관련 타입들
// ============================================

/** 게시물 기본 정보 */
export interface Post {
  id: UUID;
  user_id: UUID;
  image_url: string;
  caption?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** 게시물 생성 시 필요한 데이터 */
export interface CreatePostData {
  image_url: string;
  caption?: string;
}

/** 게시물 업데이트 데이터 */
export interface UpdatePostData {
  caption?: string;
}

/** 게시물 통계 정보 (좋아요 수, 댓글 수 포함) */
export interface PostStats {
  post_id: UUID;
  user_id: UUID;
  image_url: string;
  caption?: string;
  created_at: Timestamp;
  likes_count: number;
  comments_count: number;
}

// ============================================
// Like 관련 타입들
// ============================================

/** 좋아요 기본 정보 */
export interface Like {
  id: UUID;
  post_id: UUID;
  user_id: UUID;
  created_at: Timestamp;
}

/** 좋아요 생성 데이터 */
export interface CreateLikeData {
  post_id: UUID;
}

// ============================================
// Comment 관련 타입들
// ============================================

/** 댓글 기본 정보 */
export interface Comment {
  id: UUID;
  post_id: UUID;
  user_id: UUID;
  content: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** 댓글 생성 데이터 */
export interface CreateCommentData {
  post_id: UUID;
  content: string;
}

/** 댓글 업데이트 데이터 */
export interface UpdateCommentData {
  content: string;
}

// ============================================
// Follow 관련 타입들
// ============================================

/** 팔로우 관계 기본 정보 */
export interface Follow {
  id: UUID;
  follower_id: UUID;  // 팔로우하는 사람
  following_id: UUID; // 팔로우받는 사람
  created_at: Timestamp;
}

/** 팔로우 생성 데이터 */
export interface CreateFollowData {
  following_id: UUID;
}

// ============================================
// API 응답 타입들
// ============================================

/** 페이지네이션 정보 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** API 기본 응답 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/** 목록 API 응답 */
export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

// ============================================
// 컴포넌트 Props 타입들
// ============================================

/** 게시물 카드 Props */
export interface PostCardProps {
  post: PostStats;
  currentUserId?: UUID;
  onLike?: (postId: UUID) => void;
  onUnlike?: (postId: UUID) => void;
  onComment?: (postId: UUID) => void;
  onShowDetail?: (postId: UUID) => void;
}

/** 댓글 목록 Props */
export interface CommentListProps {
  postId: UUID;
  comments: Comment[];
  currentUserId?: UUID;
  onDelete?: (commentId: UUID) => void;
}

/** 팔로우 버튼 Props */
export interface FollowButtonProps {
  targetUserId: UUID;
  currentUserId?: UUID;
  isFollowing: boolean;
  onFollow?: (userId: UUID) => void;
  onUnfollow?: (userId: UUID) => void;
}

// ============================================
// Form 데이터 타입들
// ============================================

/** 게시물 작성 폼 데이터 */
export interface PostFormData {
  image: File | null;
  caption: string;
}

/** 댓글 작성 폼 데이터 */
export interface CommentFormData {
  content: string;
}

/** 프로필 편집 폼 데이터 */
export interface ProfileFormData {
  name: string;
  bio?: string;
}

// ============================================
// 에러 타입들
// ============================================

/** API 에러 응답 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/** 유효성 검증 에러 */
export interface ValidationError {
  field: string;
  message: string;
}

// ============================================
// 파일 업로드 관련 타입들
// ============================================

/** 업로드 파일 정보 */
export interface UploadFile {
  file: File;
  preview: string;
  name: string;
  size: number;
}

// ============================================
// 홈 피드 관련 타입들 (PostCard, PostFeed)
// ============================================

/** 게시물 + 사용자 정보 (홈 피드용) */
export interface PostWithUser {
  post_id: UUID;
  user_id: UUID;
  image_url: string;
  caption?: string;
  created_at: Timestamp;
  likes_count: number;
  comments_count: number;
  // 사용자 정보
  name: string;
  clerk_id: ClerkUserId;
  // 현재 사용자의 좋아요 상태
  isLiked: boolean;
  // 최신 댓글 2개
  recentComments: CommentWithUser[];
}

/** 댓글 + 사용자 정보 */
export interface CommentWithUser {
  id: UUID;
  post_id: UUID;
  user_id: UUID;
  content: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  // 사용자 정보
  name: string;
  clerk_id: ClerkUserId;
}

/** 게시물 피드 API 응답 */
export interface PostsResponse {
  data: PostWithUser[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
  type: string;
}

/** 업로드 결과 */
export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  size: number;
}

// ============================================
// 실시간 구독 타입들 (선택사항)
// ============================================

/** 실시간 이벤트 타입 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

/** 실시간 페이로드 */
export interface RealtimePayload<T> {
  eventType: RealtimeEvent;
  new: T | null;
  old: T | null;
  table: string;
}

// ============================================
// 유틸리티 타입들
// ============================================

/** 선택적 필드들만 있는 타입 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** 필수 필드들만 있는 타입 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** ID를 제외한 타입 (생성 시 사용) */
export type WithoutId<T extends { id: any }> = Omit<T, 'id'>;

/** 타임스탬프를 제외한 타입 */
export type WithoutTimestamps<T extends { created_at?: any; updated_at?: any }> = Omit<
  T,
  'created_at' | 'updated_at'
>;

// ============================================
// Export 정리
// ============================================

export type {
  Timestamp,
  UUID,
  ClerkUserId,
  User,
  CreateUserData,
  UpdateUserData,
  UserStats,
  Post,
  CreatePostData,
  UpdatePostData,
  PostStats,
  Like,
  CreateLikeData,
  Comment,
  CreateCommentData,
  UpdateCommentData,
  Follow,
  CreateFollowData,
  PaginationInfo,
  ApiResponse,
  ListResponse,
  PostCardProps,
  CommentListProps,
  FollowButtonProps,
  PostFormData,
  CommentFormData,
  ProfileFormData,
  ApiError,
  ValidationError,
  UploadFile,
  UploadResult,
  RealtimeEvent,
  RealtimePayload,
  PartialBy,
  RequiredBy,
  WithoutId,
  WithoutTimestamps,
  PostWithUser,
  CommentWithUser,
  PostsResponse,
};
