// ================================
// 게시판 UI 상태 관리 (Zustand)
// ================================
// 이 스토어는 "클라이언트 상태"를 관리합니다.
// - 서버 상태 (게시글 데이터): React Query (hooks/useBoard.ts)
// - 클라이언트 상태 (UI 상태): Zustand (이 파일)

import { create } from 'zustand'

// ================================
// 타입 정의
// ================================
interface BoardState {
  // ---- 검색/필터 상태 ----
  searchKeyword: string              // 검색어
  sortBy: 'latest' | 'views'         // 정렬 기준: 최신순 | 조회수순
  skip: number                       // 페이지네이션: 건너뛸 개수
  limit: number                      // 페이지네이션: 한 페이지당 개수

  // ---- 선택된 항목 ----
  selectedIds: number[]              // 체크박스로 선택된 게시글 ID 배열

  // ---- 모달 상태 ----
  isDeleteModalOpen: boolean         // 삭제 확인 모달 열림 여부
  deleteTargetId: number | null      // 삭제할 게시글 ID

  // ---- 액션 (상태를 변경하는 함수들) ----
  setSearchKeyword: (keyword: string) => void
  setSortBy: (sortBy: 'latest' | 'views') => void
  setSkip: (skip: number) => void
  nextPage: () => void
  prevPage: () => void
  resetFilters: () => void
  toggleSelect: (id: number) => void
  selectAll: (ids: number[]) => void
  clearSelection: () => void
  openDeleteModal: (id: number) => void
  closeDeleteModal: () => void
}

// ================================
// 스토어 생성
// ================================
// create<BoardState>: 위에서 정의한 타입 적용
// (set, get) => ({...}):
//   - set: 상태를 변경하는 함수
//   - get: 현재 상태를 읽는 함수 (이 파일에서는 안 씀)
export const useBoardStore = create<BoardState>((set, get) => ({
  // ================================
  // 초기 상태값
  // ================================
  searchKeyword: '',
  sortBy: 'latest',
  skip: 0,
  limit: 10,
  selectedIds: [],
  isDeleteModalOpen: false,
  deleteTargetId: null,

  // ================================
  // 검색/필터 액션
  // ================================

  // 검색어 변경 (검색하면 1페이지로 이동)
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword, skip: 0 }),

  // 정렬 기준 변경 (정렬 바꾸면 1페이지로 이동)
  setSortBy: (sortBy) => set({ sortBy, skip: 0 }),

  // skip 값 직접 설정
  setSkip: (skip) => set({ skip }),

  // 다음 페이지: skip += limit
  // 예: skip: 0 → 10 → 20 ...
  nextPage: () => set((state) => ({ skip: state.skip + state.limit })),

  // 이전 페이지: skip -= limit (최소 0)
  // Math.max(0, ...): 음수가 되지 않도록 방지
  prevPage: () => set((state) => ({ skip: Math.max(0, state.skip - state.limit) })),

  // 필터 초기화
  resetFilters: () => set({ searchKeyword: '', sortBy: 'latest', skip: 0 }),

  // ================================
  // 선택 액션 (체크박스)
  // ================================

  // 개별 선택/해제 토글
  // 이미 선택됨 → 제거 / 선택 안 됨 → 추가
  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)  // 이미 있으면 제거
        : [...state.selectedIds, id],                 // 없으면 추가
    })),

  // 전체 선택 (ID 배열을 받아서 그대로 설정)
  selectAll: (ids) => set({ selectedIds: ids }),

  // 선택 초기화
  clearSelection: () => set({ selectedIds: [] }),

  // ================================
  // 모달 액션
  // ================================

  // 삭제 모달 열기 (삭제할 ID 저장)
  openDeleteModal: (id) => set({ isDeleteModalOpen: true, deleteTargetId: id }),

  // 삭제 모달 닫기 (ID도 초기화)
  closeDeleteModal: () => set({ isDeleteModalOpen: false, deleteTargetId: null }),
}))