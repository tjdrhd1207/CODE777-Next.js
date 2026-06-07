import { create } from "zustand";

interface UserState {
    isLoggedIn: boolean;
    userId: string | null;   // users.id 컬럼 (문자열 로그인 아이디)
    userName: string;        // DB 컬럼 없음, users.id 값을 그대로 사용
    login: (userId: string, userName: string) => void;
    logout: () => void;
};

export const useUserStore = create<UserState>((set) => ({
    isLoggedIn: false,
    userId: null,
    userName: '',
    login: (userId, userName) => set({ isLoggedIn: true, userId, userName }),
    logout: () => set({ isLoggedIn: false, userId: null, userName: '' }),
}));
