'use client'

import { LogOut, Plus, User } from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import { useGameStore } from "../store/useGameStore";
import CreateRoomModal from "../components/room/CreateRoomModal";
import { useRoomStore } from "../store/useRoomStore";
import { Socket, io } from "socket.io-client";


export default function RoomListPage() {
    const { rooms, fetchRooms, updatePlayerCount } = useRoomStore();
    const { userId, logout, isLoggedIn } = useUserStore();
    const { currentRoom, setCurrentRoom } = useGameStore();
    const router = useRouter();
    const socketRef = useRef<Socket | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        // 1) DB에서 방 목록 초기 로드
        fetchRooms();

        // 2) 소켓 연결 후 현재 인원수 요청
        const socket = io('http://localhost:3000');
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('get_room_list'); // 접속 즉시 현재 인원수 받아오기
        });

        // 3) 누군가 입장/퇴장할 때마다 서버가 push → 인원수만 갱신
        socket.on('room_list_updated', (updatedList: { roomId: string; playerCount: number }[]) => {
            updatedList.forEach(({ roomId, playerCount }) => {
                updatePlayerCount(Number(roomId), playerCount);
            });
        });

        // 4) 새 방이 생겼을 때 서버가 신호 → DB 재조회 후 인원수 재요청
        socket.on('rooms_changed', () => {
            fetchRooms().then(() => {
                socket.emit('get_room_list');
            });
        });

        return () => {
            socket.off('room_list_updated');
            socket.off('rooms_changed');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [fetchRooms]);

    const handleCreateRoom = async (data: { name: string, capacity: number }) => {
        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, hostId: userId }),
            });

            const result = await response.json();

            if (result.success) {
                router.push(`/game/${result.roomSeq}`);
            }

        } catch (err) {
            console.error('방 생성 실패:', err);
        }
    }

    const handleJoinRoom = (room: typeof rooms[0]) => {
        // 1. 방이 꽉 찼는지 확인
        if (room.players >= room.capacity) {
            alert('방이 꽉찼습니다.');
            return;
        }

        // 2. 스토어에 현재 상태 저장
        setCurrentRoom(room);

        // 3. 게임 페이지 이동
        router.push(`/game/${room.room_seq}`);
    }

    useEffect(() => {
        /* TODO : 로그인 세션관련 처리하기
        if (!isLoggedIn) {
            router.replace('/');
        } */
    }, [isLoggedIn]);


    return (
        <div className="min-h-screen common-bg-style text-white p-4 md:p-8">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#FFD700]">LOBBY</h1>
                    <p className="text-gray-400 text-sm">Welcome, <span className="text-white font-bold">{userId || 'Guest'}</span></p>
                </div>
                <button
                    onClick={logout}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <LogOut size={24} className="text-gray-400" />
                </button>
            </header>

            {/* 방생성 버튼 & 검색바 */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row gap-4">
                <button
                    className="border-2 border-dashed border-[#333] p-6 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-[#FFD700] hover:bg-[#FFD700]/5 transition-all group"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="text-[#333] group-hover:text-[#FFD700]" size={40} />
                    <span className="font-bold text-[#333] group-hover:text-[#FFD700]">새로운 방 만들기</span>
                </button>
            </div>

            {/* 방 생성 모달 */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateRoomModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onCreate={handleCreateRoom}
                    >
                    </CreateRoomModal>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.filter(room => (room.players ?? 0) > 0).map((room) => {
                    return (
                        <motion.div
                            key={room.room_seq}
                            whileHover={{ y: -5 }}
                            className="bg-[#1e1e1e] border border-[#333] p-6 rounded-2xl flex flex-col justify-between h-48 hover:border-[#FFD700]/50 transition-colors"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold truncate pr-4">{room.name}</h3>
                                    <span className={`text-[10px] uppercase px-2 py-1 rounded font-bold ${room.status === 'playing' ? 'bg-gray-700 text-gray-400' : 'bg-green-500/20 text-green-500'}`}>
                                        {room.status === 'playing' ? 'Playing' : 'Wait'}
                                    </span>
                                </div>
                                <div className="flex items-center text-gray-400 text-sm gap-1">
                                    <User size={14} />
                                    <span>{room.players ?? 0} / {room.capacity}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleJoinRoom(room)}
                                disabled={room.status === 'playing'}
                                className="w-full py-3 rounded-xl font-bold bg-[#333] hover:bg-[#444] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                입장하기
                            </button>
                        </motion.div>
                    )
                })}
            </div>
        </div>

    );
}