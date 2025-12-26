# Zustand로 클라이언트 상태 관리하기

> Redux보다 간단하고 보일러플레이트가 적은 Zustand 사용법을 알아봅니다.

## Zustand란?

**Zustand**(추슈탄트)는 독일어로 "상태(State)"라는 뜻입니다.
Redux보다 훨씬 간단하고, Context API보다 성능이 좋은 상태 관리 라이브러리입니다.

---

## 언제 Zustand를 쓸까?

### 서버 상태 vs 클라이언트 상태

```
"이 데이터가 서버에 있어?"
   → Yes: React Query (hooks)
   → No:  Zustand (store)
```

| | 서버 상태 (React Query) | 클라이언트 상태 (Zustand) |
|--|------------------------|-------------------------|
| **데이터 출처** | API에서 가져옴 | 브라우저에서 생성 |
| **예시** | 게시글 목록, 유저 정보 | 다크모드, 장바구니, 모달 |

---

## 설치

```bash
pnpm add zustand
```

---

## 기본 사용법

### 1. 스토어 생성

```typescript
// store/useCounterStore.ts
import { create } from 'zustand'

// 타입 정의
interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

// 스토어 생성
export const useCounterStore = create<CounterStore>((set) => ({
  // 상태
  count: 0,

  // 액션 (상태를 변경하는 함수)
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

### 2. 컴포넌트에서 사용

```tsx
import { useCounterStore } from '@/store/useCounterStore'

function Counter() {
  const { count, increment, decrement, reset } = useCounterStore()

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

**끝!** Redux처럼 Provider로 감쌀 필요도 없습니다.

---

## set 함수 이해하기

```typescript
// 이전 상태가 필요할 때
increment: () => set((state) => ({ count: state.count + 1 }))
//                    └── 현재 상태를 받아서 새 상태 반환

// 이전 상태가 필요 없을 때
reset: () => set({ count: 0 })
//           └── 바로 새 값 전달
```

---

## 실전 예제: 게시판 UI 상태

게시판에서 필요한 클라이언트 상태들:

```typescript
// store/useBoardUIStore.ts
import { create } from 'zustand'

interface BoardUIStore {
  // 상태
  selectedPostId: number | null    // 선택된 게시글
  isDeleteModalOpen: boolean       // 삭제 모달 열림 여부
  isFormModalOpen: boolean         // 작성/수정 모달
  editMode: boolean                // 수정 모드인지

  // 액션
  selectPost: (id: number) => void
  clearSelection: () => void
  openDeleteModal: () => void
  closeDeleteModal: () => void
  openFormModal: (editMode?: boolean) => void
  closeFormModal: () => void
}

export const useBoardUIStore = create<BoardUIStore>((set) => ({
  // 초기 상태
  selectedPostId: null,
  isDeleteModalOpen: false,
  isFormModalOpen: false,
  editMode: false,

  // 액션들
  selectPost: (id) => set({ selectedPostId: id }),
  clearSelection: () => set({ selectedPostId: null }),

  openDeleteModal: () => set({ isDeleteModalOpen: true }),
  closeDeleteModal: () => set({ isDeleteModalOpen: false }),

  openFormModal: (editMode = false) => set({
    isFormModalOpen: true,
    editMode,
  }),
  closeFormModal: () => set({
    isFormModalOpen: false,
    editMode: false,
  }),
}))
```

### 컴포넌트에서 사용

```tsx
function BoardList() {
  const { selectPost, openDeleteModal } = useBoardUIStore()

  const handleDelete = (id: number) => {
    selectPost(id)
    openDeleteModal()
  }

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          {post.title}
          <button onClick={() => handleDelete(post.id)}>삭제</button>
        </li>
      ))}
    </ul>
  )
}

function DeleteModal() {
  const { isDeleteModalOpen, selectedPostId, closeDeleteModal } = useBoardUIStore()
  const { mutate: deletePost } = useDeletePost()

  if (!isDeleteModalOpen) return null

  return (
    <div className="modal">
      <p>정말 삭제하시겠습니까?</p>
      <button onClick={() => {
        deletePost(selectedPostId!)
        closeDeleteModal()
      }}>
        삭제
      </button>
      <button onClick={closeDeleteModal}>취소</button>
    </div>
  )
}
```

---

## 선택적 구독 (성능 최적화)

전체 상태를 가져오면 어떤 값이 바뀌어도 리렌더링됩니다.

```tsx
// ❌ 비효율: count가 바뀔 때도 리렌더링
const { isOpen, openModal } = useModalStore()

// ✅ 효율: isOpen이 바뀔 때만 리렌더링
const isOpen = useModalStore((state) => state.isOpen)
const openModal = useModalStore((state) => state.openModal)
```

---

## 고급 패턴

### 1. 비동기 액션

```typescript
const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,

  fetchUser: async (id: string) => {
    set({ loading: true })
    const user = await fetch(`/api/users/${id}`).then(res => res.json())
    set({ user, loading: false })
  },
}))
```

### 2. Persist (로컬스토리지 저장)

```typescript
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist<ThemeStore>(
    (set) => ({
      isDark: false,
      toggle: () => set((state) => ({ isDark: !state.isDark })),
    }),
    { name: 'theme-storage' }  // 로컬스토리지 키
  )
)
```

새로고침해도 상태가 유지됩니다!

### 3. Devtools

```typescript
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools<Store>(
    (set) => ({ ... }),
    { name: 'MyStore' }
  )
)
```

Redux DevTools에서 상태 변화를 확인할 수 있습니다.

---

## Redux vs Zustand 비교

### Redux (보일러플레이트 많음)

```typescript
// 1. 액션 타입
const INCREMENT = 'INCREMENT'

// 2. 액션 생성자
const increment = () => ({ type: INCREMENT })

// 3. 리듀서
const counterReducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case INCREMENT:
      return { count: state.count + 1 }
    default:
      return state
  }
}

// 4. 스토어 생성
const store = createStore(counterReducer)

// 5. Provider 감싸기
// 6. useSelector, useDispatch 사용...
```

### Zustand (간단!)

```typescript
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
```

---

## 정리

| 개념 | 설명 |
|------|------|
| **create** | 스토어를 만드는 함수 |
| **set** | 상태를 변경하는 함수 |
| **선택적 구독** | 필요한 상태만 가져오기 (성능 최적화) |
| **persist** | 로컬스토리지에 저장 |

---

## React Query + Zustand 조합

```
서버 상태 (React Query)     클라이언트 상태 (Zustand)
├── 게시글 목록              ├── 다크모드
├── 게시글 상세              ├── 모달 열림/닫힘
├── 유저 정보                ├── 선택된 아이템
└── 댓글 목록                └── 폼 상태
```

이 조합이 현재 가장 인기 있는 패턴입니다!

---

## 참고

- [Zustand 공식 문서](https://docs.pmnd.rs/zustand)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [HanUI 게시판 킷](https://www.hanui.io/kits/board)
