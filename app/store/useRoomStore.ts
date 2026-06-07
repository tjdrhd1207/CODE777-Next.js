import { create } from 'zustand';

export interface Room {
  room_seq: number;
  name: string;
  capacity: number;
  turnTime: number;
  hostId: string;
  status: 'waiting' | 'playing';
  players: number;
}

interface RoomState {
  rooms: Room[];
  fetchRooms: () => Promise<void>;
}

export const useRoomStore = create<RoomState>((set) =>({
    rooms: [],
    fetchRooms: async () => {
        const res = await fetch('/api/rooms');
        const data = await res.json();
        if (data.success) {
            set({ rooms: data.rooms });
        }
    },
}));
