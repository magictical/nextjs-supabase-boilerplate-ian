import { notFound } from "next/navigation";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";

/**
 * 프로필 페이지
 *
 * 동적 라우트: /profile/[userId] (Clerk user ID)
 * - 사용자 정보 표시 (ProfileHeader)
 * - 게시물 그리드 표시 (PostGrid)
 * - 게시물 상세 모달 연동
 */

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  try {
    // 사용자 정보 조회
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/${userId}`, {
      cache: 'no-store', // 실시간 데이터 필요
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound(); // Next.js 404 페이지 표시
      }
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const profileData = await response.json();
    const { user, isFollowing, isOwnProfile } = profileData;

    return (
      <ProfilePageClient
        userId={userId}
        user={user}
        isFollowing={isFollowing}
        isOwnProfile={isOwnProfile}
      />
    );
  } catch (error) {
    console.error('Profile page error:', error);

    // 에러 발생 시 404 페이지로 리다이렉트
    notFound();
  }
}

// 메타데이터 설정 (선택사항)
export async function generateMetadata({ params }: ProfilePageProps) {
  const { userId } = await params;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/${userId}`);
    if (!response.ok) {
      return {
        title: '사용자를 찾을 수 없습니다',
      };
    }

    const profileData = await response.json();
    const { user } = profileData;

    return {
      title: `${user.name} (@${user.name}) • Instagram 클론`,
      description: `${user.name}님의 프로필입니다. ${user.posts_count}개의 게시물을 확인하세요.`,
    };
  } catch (error) {
    return {
      title: '프로필',
      description: 'Instagram 클론 프로필 페이지',
    };
  }
}
