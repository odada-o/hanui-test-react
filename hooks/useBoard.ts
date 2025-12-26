// ================================
// 게시글 관련 React Query 훅들
// ================================
// React Query: 서버 상태 관리 라이브러리
// - 자동 캐싱 (같은 요청 반복 안 함)
// - 로딩/에러 상태 자동 관리
// - 데이터 자동 갱신

// useQuery: 데이터 조회(GET)용
// useMutation: 데이터 변경(POST, PUT, DELETE)용
// useQueryClient: 캐시를 직접 조작할 때 사용
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// API 함수들 가져오기
import { getPosts, getPost, createPost, updatePost, deletePost } from '@/api/board'

// 타입 가져오기
import type { PostListParams, PostFormData } from '@/types/board'

// ================================
// Query Keys (쿼리 키)
// ================================
// React Query는 queryKey로 캐시를 구분함
// 같은 키 = 같은 데이터 = 캐시에서 가져옴
//
// 예시:
// ['board', 'list', { limit: 10 }] → 목록 (10개)
// ['board', 'list', { limit: 20 }] → 목록 (20개) - 다른 캐시
// ['board', 'detail', 1] → 1번 게시글 상세
// ['board', 'detail', 2] → 2번 게시글 상세 - 다른 캐시
export const boardKeys = {
  all: ['board'] as const,                                    // 기본 키
  lists: () => [...boardKeys.all, 'list'] as const,           // ['board', 'list']
  list: (params: PostListParams) => [...boardKeys.lists(), params] as const,  // ['board', 'list', {params}]
  details: () => [...boardKeys.all, 'detail'] as const,       // ['board', 'detail']
  detail: (id: number) => [...boardKeys.details(), id] as const,  // ['board', 'detail', id]
}

// ================================
// 게시글 목록 조회 훅
// ================================
// 사용법:
// const { data, isLoading, error } = usePosts({ limit: 10, skip: 0 })
//
// 반환값:
// - data: 게시글 목록 데이터
// - isLoading: 로딩 중이면 true
// - error: 에러 발생 시 에러 객체
// - refetch: 수동으로 다시 가져오기
export function usePosts(params?: PostListParams) {
  return useQuery({
    // queryKey: 이 키로 캐시 저장/조회
    queryKey: boardKeys.list(params || {}),
    // queryFn: 실제 API 호출 함수
    queryFn: () => getPosts(params),
  })
}

// ================================
// 게시글 상세 조회 훅
// ================================
// 사용법:
// const { data: post, isLoading } = usePost(1)
export function usePost(id: number) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: () => getPost(id),
    // enabled: 조건이 true일 때만 요청 실행
    // !!id: id가 있으면 true, 없으면 false
    // id가 0이나 undefined면 요청 안 함
    enabled: !!id,
  })
}

// ================================
// 게시글 작성 훅 (Create)
// ================================
// 사용법:
// const { mutate, isPending } = useCreatePost()
// mutate({ title: '제목', body: '내용', userId: 1 })
export function useCreatePost() {
  // queryClient: 캐시를 조작하는 객체
  const queryClient = useQueryClient()

  return useMutation({
    // mutationFn: 실행할 API 함수
    mutationFn: createPost,

    // onSuccess: 성공 시 실행되는 콜백
    onSuccess: () => {
      // invalidateQueries: 해당 키의 캐시를 무효화 (다시 가져오게 함)
      // 게시글 작성 후 → 목록 새로고침
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
    },
  })
}

// ================================
// 게시글 수정 훅 (Update)
// ================================
// 사용법:
// const { mutate } = useUpdatePost()
// mutate({ id: 1, data: { title: '수정', body: '내용', userId: 1 } })
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    // 매개변수를 객체로 받아서 구조분해
    // { id, data } 형태로 전달해야 함
    mutationFn: ({ id, data }: { id: number; data: PostFormData }) => updatePost(id, data),

    // onSuccess의 두 번째 인자: mutationFn에 전달한 변수들
    onSuccess: (_, { id }) => {
      // 목록 캐시 무효화 (목록에서 제목 등이 바뀌었을 수 있음)
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
      // 해당 게시글 상세 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(id) })
    },
  })
}

// ================================
// 게시글 삭제 훅 (Delete)
// ================================
// 사용법:
// const { mutate } = useDeletePost()
// mutate(1)  // 1번 게시글 삭제
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      // 삭제 후 목록 새로고침
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
    },
  })
}