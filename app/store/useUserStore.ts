import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
    isLoggedIn: boolean;
    userId: string | null;
    userName: string;
    login: (userId: string, userName: string) => void;
    logout: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            isLoggedIn: false,
            userId: null,
            userName: '',
            login: (userId, userName) => set({ isLoggedIn: true, userId, userName }),
            logout: () => set({ isLoggedIn: false, userId: null, userName: '' }),
        }),
        {
            name: 'code777-user', // localStorage 키 이름
        }
    )
);
