// ================================
// 게시글 관련 타입 정의
// ================================

// 단일 게시글의 타입
export interface Post {
  id: number;        // 게시글 고유 ID
  title: string;     // 게시글 제목
  body: string;      // 게시글 본문 내용
  tags: string[];    // 태그 배열 (예: ["react", "javascript"])
  reactions: {       // 반응 정보
    likes: number;   // 좋아요 수
    dislikes: number // 싫어요 수
  };
  views: number;     // 조회수
  userId: number;    // 작성자 ID
}

// 게시글 목록 API 응답 타입
// GET /posts 요청 시 서버에서 이 형태로 응답함
export interface PostListResponse {
  posts: Post[];    // 게시글 배열
  total: number;    // 전체 게시글 수 (페이지네이션 계산용)
  skip: number;     // 건너뛴 개수 (예: 2페이지면 10개 건너뜀)
  limit: number;    // 한 페이지당 게시글 수
}

// 게시글 작성/수정 시 보내는 데이터 타입
// POST /posts 요청 시 이 형태로 전송함
export interface PostFormDate {
  title: string;     // 제목 (필수)
  body: string;      // 본문 (필수)
  userId: number;    // 작성자 ID (필수)
  tags?: string[];   // 태그 (선택) - ?는 optional(선택적)이라는 뜻
}

// 게시글 목록 조회 시 사용하는 파라미터
// GET /posts?skip=0&limit=10&search=react 형태로 전송됨
export interface PostListParams {
  skip?: number;                  // 건너뛸 개수 (기본값: 0)
  limit?: number;                 // 가져올 개수 (기본값: 10)
  search?: string;                // 검색어
  sortBy?: 'latest' | 'views';    // 정렬 기준: 최신순 또는 조회수순
}