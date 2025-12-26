// ================================
// 게시글 API 함수들
// ================================

// axios: HTTP 요청 라이브러리 (fetch보다 편리함)
import axios from 'axios'
// 타입들을 가져옴 (코드 자동완성 & 타입 체크용)
import type { Post, PostListResponse, PostFormData, PostListParams } from '@/types/board'

// 🔗 DummyJSON 무료 API (테스트용)
// 실제 프로젝트에서는 환경변수로 관리: process.env.NEXT_PUBLIC_API_URL
const API_URL = 'https://dummyjson.com'

// axios 인스턴스 생성
// 매번 baseURL, headers를 쓸 필요 없이 재사용 가능
const api = axios.create({
  baseURL: API_URL,                              // 기본 URL 설정
  headers: { 'Content-Type': 'application/json' }, // JSON 형식으로 통신
})

// ================================
// 게시글 목록 조회 (Read - 여러 개)
// ================================
// 사용법: getPosts({ limit: 10, skip: 0, search: '검색어' })
// 반환값: { posts: [...], total: 150, skip: 0, limit: 10 }
export async function getPosts(params?: PostListParams): Promise<PostListResponse> {
  // 검색어가 있으면 검색 전용 API 사용
  // params?.search: params가 있고, search도 있으면 true
  if (params?.search) {
    const { data } = await api.get('/posts/search', {
      params: { q: params.search, limit: params.limit, skip: params.skip }
      // 실제 요청: GET /posts/search?q=검색어&limit=10&skip=0
    })
    return data
  }

  // 일반 목록 조회
  const { data } = await api.get('/posts', {
    params: { limit: params?.limit || 10, skip: params?.skip || 0 }
    // params?.limit || 10: limit이 없으면 기본값 10 사용
    // 실제 요청: GET /posts?limit=10&skip=0
  })
  return data
}

// ================================
// 게시글 상세 조회 (Read - 한 개)
// ================================
// 사용법: getPost(1)
// 반환값: { id: 1, title: '...', body: '...', ... }
export async function getPost(id: number): Promise<Post> {
  // 템플릿 리터럴로 URL에 id 삽입
  // 실제 요청: GET /posts/1
  const { data } = await api.get(`/posts/${id}`)
  return data
}

// ================================
// 게시글 작성 (Create)
// ================================
// 사용법: createPost({ title: '제목', body: '내용', userId: 1 })
// ⚠️ DummyJSON은 실제 저장 안 됨! 응답만 반환 (테스트용)
export async function createPost(formData: PostFormData): Promise<Post> {
  // POST 요청: 데이터를 서버에 전송
  // 실제 요청: POST /posts/add + body: { title, body, userId }
  const { data } = await api.post('/posts/add', formData)
  return data
}

// ================================
// 게시글 수정 (Update)
// ================================
// 사용법: updatePost(1, { title: '수정된 제목', body: '수정된 내용', userId: 1 })
export async function updatePost(id: number, formData: PostFormData): Promise<Post> {
  // PUT 요청: 기존 데이터를 새 데이터로 교체
  // 실제 요청: PUT /posts/1 + body: { title, body, userId }
  const { data } = await api.put(`/posts/${id}`, formData)
  return data
}

// ================================
// 게시글 삭제 (Delete)
// ================================
// 사용법: deletePost(1)
// 반환값: { ...게시글정보, isDeleted: true, deletedOn: '시간' }
export async function deletePost(id: number): Promise<Post & { isDeleted: boolean }> {
  // DELETE 요청: 데이터 삭제
  // Post & { isDeleted: boolean }: Post 타입 + isDeleted 필드 추가
  // 실제 요청: DELETE /posts/1
  const { data } = await api.delete(`/posts/${id}`)
  return data
}