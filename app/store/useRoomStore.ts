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
  updatePlayerCount: (roomSeq: number, playerCount: number) => void;
}

export const useRoomStore = create<RoomState>((set) =>({
    rooms: [],
    fetchRooms: async () => {
        const res = await fetch('/api/rooms');
        const data = await res.json();
        if (data.success) {
            set({ rooms: data.rooms.map((r: any) => ({ ...r, players: r.playerCount ?? 0 })) });
        }
    },
    // 소켓에서 받은 실시간 인원수를 해당 방에만 반영
    updatePlayerCount: (roomSeq, playerCount) => {
        set((state) => ({
            rooms: state.rooms.map((room) =>
                room.room_seq === roomSeq ? { ...room, players: playerCount } : room
            ),
        }));
    },
}));
