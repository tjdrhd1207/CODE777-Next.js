import { create } from "zustand";

interface UserState {
    isLoggedIn: boolean;
    userId: string | null;
    userName: string | '';
    login: (userId: string) => void;
    logout: () => void;
};

export const useUserStore = create<UserState>((set) => ({
    isLoggedIn: false,
    userId: null,
    userName: '',
    login: (userId) => set({isLoggedIn: true, userId: userId }),
    logout: () => set({ isLoggedIn: false, userId: null }),
}));