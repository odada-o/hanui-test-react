// zustand에서 create 함수를 가져옴
// create: 스토어를 만드는 핵심 함수
import { create } from "zustand";

// 스토어의 타입 정의 (TypeScript)
// 스토어가 어떤 데이터와 함수를 가질지 미리 선언
interface CounterStore {
    count: number;           // 상태: 숫자 값
    increment: () => void;   // 액션: 1 증가시키는 함수
    decrement: () => void;   // 액션: 1 감소시키는 함수
    reset: () => void;       // 액션: 0으로 초기화하는 함수
}

// 스토어 생성 및 내보내기
// create<CounterStore>: 위에서 정의한 타입을 적용
// (set) => ({...}): set은 상태를 변경하는 함수
export const useCounterStore = create<CounterStore>((set) => ({
  // 초기 상태값
  count: 0,

  // set((state) => ({...})): 현재 상태(state)를 받아서 새 상태를 반환
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),

  // set({...}): 이전 상태가 필요 없으면 바로 새 값을 전달해도 됨
  reset: () => set({ count: 0 }),
}))