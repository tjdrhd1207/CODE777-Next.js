import { create } from "zustand";
import { Room } from "./useRoomStore";

interface GameState {
    currentRoom: Room | null;
    setCurrentRoom: (room: Room | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
    currentRoom: null,
    setCurrentRoom: (room) => set({ currentRoom: room }),
}))
