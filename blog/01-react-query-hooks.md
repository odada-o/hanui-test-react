# React Query로 서버 상태 관리하기

> 게시판 CRUD를 예제로 React Query 사용법을 알아봅니다.

## 서버 상태 vs 클라이언트 상태

React 앱에서 상태는 크게 두 가지로 나뉩니다.

| 구분 | 서버 상태 | 클라이언트 상태 |
|------|----------|----------------|
| **데이터 출처** | API에서 가져옴 | 브라우저에서 생성 |
| **예시** | 게시글 목록, 유저 정보 | 다크모드, 모달 열림 |
| **관리 도구** | React Query | Zustand, Redux |

---

## React Query를 쓰는 이유

### 직접 구현하면?

```tsx
// 매번 이렇게 작성해야 함...
const [posts, setPosts] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  setLoading(true)
  fetch('/api/posts')
    .then(res => res.json())
    .then(data => setPosts(data))
    .catch(err => setError(err))
    .finally(() => setLoading(false))
}, [])
```

### React Query를 쓰면?

```tsx
// 한 줄로 끝!
const { data, isLoading, error } = usePosts()
```

### 장점 정리

- **자동 캐싱**: 같은 요청 반복 안 함
- **자동 갱신**: 탭 전환, 네트워크 재연결 시 데이터 갱신
- **로딩/에러 상태**: 자동으로 관리해줌
- **코드 재사용**: 훅으로 만들어서 어디서든 사용

---

## 프로젝트 구조

```
src/
├── api/
│   └── board.ts          # API 함수 (순수 함수)
├── hooks/
│   └── useBoard.ts       # React Query 훅
└── types/
    └── board.ts          # 타입 정의
```

**왜 api와 hooks를 분리할까?**

- `api/`: 서버와 통신만 담당 (순수 함수)
- `hooks/`: React 기능 추가 (캐싱, 로딩 상태 등)

```
컴포넌트 → hooks/useBoard.ts → api/board.ts → 서버
              (React 상태)        (HTTP 요청)
```

---

## 1단계: 타입 정의

먼저 데이터 구조를 정의합니다.

```typescript
// types/board.ts

// 단일 게시글
export interface Post {
  id: number
  title: string
  body: string
  tags: string[]
  reactions: { likes: number; dislikes: number }
  views: number
  userId: number
}

// 목록 API 응답 (페이지네이션 포함)
export interface PostListResponse {
  posts: Post[]
  total: number    // 전체 게시글 수
  skip: number     // 건너뛴 개수
  limit: number    // 페이지당 개수
}

// 게시글 작성/수정 시 전송할 데이터
export interface PostFormData {
  title: string
  body: string
  userId: number
  tags?: string[]  // 선택적
}

// 목록 조회 파라미터
export interface PostListParams {
  skip?: number
  limit?: number
  search?: string
}
```

---

## 2단계: API 함수 작성

axios로 CRUD 함수를 만듭니다.

```typescript
// api/board.ts
import axios from 'axios'
import type { Post, PostListResponse, PostFormData, PostListParams } from '@/types/board'

const API_URL = 'https://dummyjson.com'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// 목록 조회
export async function getPosts(params?: PostListParams): Promise<PostListResponse> {
  if (params?.search) {
    const { data } = await api.get('/posts/search', {
      params: { q: params.search, limit: params.limit, skip: params.skip }
    })
    return data
  }
  const { data } = await api.get('/posts', {
    params: { limit: params?.limit || 10, skip: params?.skip || 0 }
  })
  return data
}

// 상세 조회
export async function getPost(id: number): Promise<Post> {
  const { data } = await api.get(`/posts/${id}`)
  return data
}

// 작성
export async function createPost(formData: PostFormData): Promise<Post> {
  const { data } = await api.post('/posts/add', formData)
  return data
}

// 수정
export async function updatePost(id: number, formData: PostFormData): Promise<Post> {
  const { data } = await api.put(`/posts/${id}`, formData)
  return data
}

// 삭제
export async function deletePost(id: number): Promise<Post & { isDeleted: boolean }> {
  const { data } = await api.delete(`/posts/${id}`)
  return data
}
```

---

## 3단계: Query Keys 설계

React Query는 **queryKey**로 캐시를 구분합니다.

```typescript
// hooks/useBoard.ts

export const boardKeys = {
  all: ['board'] as const,
  lists: () => [...boardKeys.all, 'list'] as const,
  list: (params: PostListParams) => [...boardKeys.lists(), params] as const,
  details: () => [...boardKeys.all, 'detail'] as const,
  detail: (id: number) => [...boardKeys.details(), id] as const,
}
```

### 실제 키 값

```typescript
boardKeys.all                    // ['board']
boardKeys.lists()                // ['board', 'list']
boardKeys.list({ limit: 10 })    // ['board', 'list', { limit: 10 }]
boardKeys.detail(1)              // ['board', 'detail', 1]
```

### 왜 계층 구조로 만들까?

캐시 무효화할 때 편합니다.

```typescript
// 1번 게시글만 무효화
invalidateQueries({ queryKey: boardKeys.detail(1) })

// 모든 목록 무효화
invalidateQueries({ queryKey: boardKeys.lists() })

// board 관련 전부 무효화
invalidateQueries({ queryKey: boardKeys.all })
```

---

## 4단계: React Query 훅 작성

### 조회 훅 (useQuery)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 목록 조회
export function usePosts(params?: PostListParams) {
  return useQuery({
    queryKey: boardKeys.list(params || {}),
    queryFn: () => getPosts(params),
  })
}

// 상세 조회
export function usePost(id: number) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: () => getPost(id),
    enabled: !!id,  // id가 있을 때만 요청
  })
}
```

### 변경 훅 (useMutation)

```typescript
// 작성
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // 작성 성공 → 목록 캐시 무효화 → 자동 갱신
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
    },
  })
}

// 수정
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PostFormData }) =>
      updatePost(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(id) })
    },
  })
}

// 삭제
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() })
    },
  })
}
```

---

## 5단계: 컴포넌트에서 사용

```tsx
// 목록 컴포넌트
function BoardList() {
  const { data, isLoading, error } = usePosts({ limit: 10 })

  if (isLoading) return <p>로딩중...</p>
  if (error) return <p>에러 발생!</p>
  if (data?.posts.length === 0) return <p>게시글이 없습니다.</p>

  return (
    <ul>
      {data?.posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

```tsx
// 작성 컴포넌트
function CreatePost() {
  const { mutate, isPending } = useCreatePost()

  const handleSubmit = (formData: PostFormData) => {
    mutate(formData, {
      onSuccess: () => alert('작성 완료!'),
      onError: () => alert('작성 실패!'),
    })
  }

  return (
    <button onClick={() => handleSubmit({ title: '제목', body: '내용', userId: 1 })}>
      {isPending ? '저장중...' : '작성하기'}
    </button>
  )
}
```

---

## 캐시 무효화 흐름

```
게시글 작성 성공
       ↓
invalidateQueries 호출
       ↓
목록 캐시 무효화 (stale)
       ↓
자동으로 다시 fetch
       ↓
목록 새로고침!
```

---

## 정리

| 개념 | 설명 |
|------|------|
| **useQuery** | 데이터 조회 (GET) |
| **useMutation** | 데이터 변경 (POST, PUT, DELETE) |
| **queryKey** | 캐시를 구분하는 키 |
| **invalidateQueries** | 캐시 무효화 (다시 가져오게 함) |
| **enabled** | 조건부 요청 |

---

## 다음 글

- [Zustand로 클라이언트 상태 관리하기](/blog/02-zustand-store)

---

## 참고

- [React Query 공식 문서](https://tanstack.com/query/latest)
- [DummyJSON API](https://dummyjson.com/)
- [HanUI 게시판 킷](https://www.hanui.io/kits/board)
