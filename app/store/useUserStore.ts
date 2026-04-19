import { create } from "zustand";

interface UserState {
    isLoggedIn: boolean;
    username: string | null;
    login: (name: string) => void;
    logout: () => void;
};

export const useUserStore = create<UserState>((set) => ({
    isLoggedIn: false,
    username: null,
    login: (name) => set({isLoggedIn: true, username: name }),
    logout: () => set({ isLoggedIn: false, username: null }),
}));