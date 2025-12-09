# 반응형 테스트 체크리스트

## 테스트 화면 크기

### Mobile

- [ ] 375px (iPhone SE)
- [ ] 390px (iPhone 12/13)
- [ ] 428px (iPhone 14 Pro Max)

### Tablet

- [ ] 768px (iPad)
- [ ] 834px (iPad Pro)
- [ ] 1024px (iPad Pro landscape)

### Desktop

- [ ] 1280px
- [ ] 1440px
- [ ] 1920px

## 컴포넌트별 테스트

### Sidebar (`components/layout/Sidebar.tsx`)

- [ ] Desktop (≥1024px): 244px 너비, 아이콘 + 텍스트 표시
- [ ] Tablet (768px~1023px): 72px 너비, 아이콘만 표시
- [ ] Mobile (<768px): 숨김 처리 확인

### Header (`components/layout/Header.tsx`)

- [ ] Mobile (<768px): 표시됨, 60px 높이
- [ ] Tablet/Desktop (≥768px): 숨김 처리 확인

### BottomNav (`components/layout/BottomNav.tsx`)

- [ ] Mobile (<768px): 표시됨, 50px 높이
- [ ] Tablet/Desktop (≥768px): 숨김 처리 확인

### PostCard (`components/post/PostCard.tsx`)

- [ ] 모든 화면 크기에서 이미지 1:1 정사각형 유지
- [ ] 텍스트 오버플로우 처리 확인
- [ ] 버튼 터치 영역 적절한 크기 (최소 44x44px)

### PostModal (`components/post/PostModal.tsx`)

- [ ] Desktop: 모달 형식 (이미지 50% + 댓글 50%)
- [ ] Mobile: 전체 페이지로 전환

### ProfileHeader (`components/profile/ProfileHeader.tsx`)

- [ ] Desktop: 프로필 이미지 150px
- [ ] Mobile: 프로필 이미지 90px

### PostGrid (`components/profile/PostGrid.tsx`)

- [ ] 모든 화면 크기에서 3열 그리드 유지
- [ ] 썸네일 1:1 정사각형 유지

## 페이지별 테스트

### 홈 페이지 (`/`)

- [ ] 모든 화면 크기에서 레이아웃 정상 표시
- [ ] 무한 스크롤 정상 동작
- [ ] 게시물 카드 레이아웃 깨짐 없음

### 프로필 페이지 (`/profile/[userId]`)

- [ ] 프로필 헤더 반응형 레이아웃
- [ ] 게시물 그리드 3열 유지
- [ ] 통계 정보 정상 표시

### 게시물 상세 모달

- [ ] Desktop: 모달 형식
- [ ] Mobile: 전체 페이지

## 터치 인터랙션 테스트

### 더블탭 좋아요

- [ ] 이미지 더블탭 시 좋아요 동작
- [ ] 큰 하트 애니메이션 표시 (1초 fade in/out)

### 터치 영역

- [ ] 모든 버튼 최소 44x44px 터치 영역
- [ ] 링크 최소 44x44px 터치 영역

### 스크롤 성능

- [ ] 무한 스크롤 부드러움
- [ ] 스크롤 시 성능 저하 없음

