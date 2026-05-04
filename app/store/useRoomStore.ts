import { create } from 'zustand';

interface Room {
  id: number;
  title: string;
  maxPlayers: number;
  hostId: number;
  status: string;
}

interface RoomState {
  rooms: Room[];
  fetchRooms: () => Promise<void>;
}

export const useRoomStore = create<RoomState>((set) =>({
    rooms: [],
    fetchRooms: async () => {
        const res = await fetch('/api/rooms');
        const data = await res.json()
        if (data.success) {
            set({ rooms: data.rooms });
        }
    },
}));