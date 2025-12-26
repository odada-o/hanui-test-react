// ================================
// 게시글 관련 타입 정의
// ================================
// TypeScript에서 데이터 구조를 미리 정의해두면:
// 1. 자동완성 지원 (IDE에서 점 찍으면 속성 목록 표시)
// 2. 타입 체크 (잘못된 타입 사용 시 에러 표시)
// 3. 코드 문서화 (어떤 데이터가 있는지 한눈에 파악)

// ================================
// 단일 게시글 타입
// ================================
// API 응답 예시:
// {
//   "id": 1,
//   "title": "His mother had always taught him",
//   "body": "His mother had always taught him not to...",
//   "tags": ["history", "american"],
//   "reactions": { "likes": 192, "dislikes": 25 },
//   "views": 305,
//   "userId": 121
// }
export interface Post {
  id: number           // 게시글 고유 ID (서버에서 자동 생성)
  title: string        // 게시글 제목
  body: string         // 게시글 본문 내용
  tags: string[]       // 태그 배열 (예: ["react", "javascript"])
  reactions: {         // 반응 정보 (중첩 객체)
    likes: number      // 좋아요 수
    dislikes: number   // 싫어요 수
  }
  views: number        // 조회수
  userId: number       // 작성자 ID (User 테이블의 id 참조)
}

// ================================
// 게시글 목록 API 응답 타입
// ================================
// GET /posts 요청 시 서버에서 이 형태로 응답함
// 페이지네이션 정보가 함께 포함됨
// 응답 예시:
// {
//   "posts": [...],    <- 게시글 배열
//   "total": 150,      <- 전체 게시글 수
//   "skip": 0,         <- 건너뛴 개수
//   "limit": 10        <- 요청한 개수
// }
export interface PostListResponse {
  posts: Post[]    // 게시글 배열 (Post 타입의 배열)
  total: number    // 전체 게시글 수 (총 페이지 수 계산용)
  skip: number     // 건너뛴 개수 (현재 페이지 계산용)
  limit: number    // 한 페이지당 게시글 수
}

// ================================
// 게시글 작성/수정 폼 데이터
// ================================
// POST /posts/add (생성) 또는 PUT /posts/:id (수정) 시 전송
// Post와 다르게 id, views, reactions는 없음 (서버에서 관리)
export interface PostFormData {
  title: string      // 제목 (필수)
  body: string       // 본문 (필수)
  userId: number     // 작성자 ID (필수)
  tags?: string[]    // 태그 (선택) - ?는 optional이라는 뜻
}

// ================================
// 게시글 목록 조회 파라미터
// ================================
// GET /posts?skip=0&limit=10&search=react 형태로 전송됨
// 모든 필드가 optional (?)이므로 필요한 것만 전달 가능
export interface PostListParams {
  skip?: number                  // 건너뛸 개수 (기본값: 0)
  limit?: number                 // 가져올 개수 (기본값: 10, 최대: 30)
  search?: string                // 검색어 (제목, 본문에서 검색)
  sortBy?: 'latest' | 'views'    // 정렬 기준: 최신순 | 조회수순
  // 'latest' | 'views': 유니온 타입 - 이 두 값만 허용
}