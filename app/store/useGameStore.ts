import { create } from "zustand";

interface Room {
  id: string;
  title: string;
  players: string[];
  maxPlayers: number;
  status: 'waiting' | 'playing';
}

interface GameState {
    currentRoom: Room | null;
    setCurrentRoom: (room: Room | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
    currentRoom: null,
    setCurrentRoom: (room) => set({ currentRoom: room }),
}))