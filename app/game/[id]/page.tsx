'use client';

import { CheckCircle2, MessageSquare, PlayIcon, ShieldCheck, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from 'framer-motion';
import { useUserStore } from "../../store/useUserStore";
import { useGameStore } from "../../store/useGameStore";
import { Socket, io } from "socket.io-client";


export default function GameLobbyPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id;
    const { userId, userName } = useUserStore();
    const { currentRoom } = useGameStore();
    const [isReady, setIsReady] = useState(false);
    const [players, setPlayers] = useState<{ userId: string; userName: string; isReady: boolean; isHost: boolean }[]>([]);
    const [messages, setMessages] = useState<{ userId: string; userName: string; message: string; time: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io('http://localhost:3000');
        socketRef.current = socket;

        // 리스너 먼저 등록
        socket.on('update_player_list', (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        // 연결 완료 후 입장 emit
        socket.on('connect', () => {
            socket.emit('join_room', { roomId, userId, userName });
        });

        return () => {
            socket.emit('leave_room', { roomId, userId });
            socket.off('update_player_list');
            socket.off('receive_message');
            socket.off('connect');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomId, userId]);

    // 가상의 플레이어 목록 (나중엔 Socket.io로 실시간 동기화)
    /* const [players, setPlayers] = useState([
        { id: '1', name: '나', isReady: false, isHost: true },
        { id: '2', name: '김철수', isReady: true, isHost: false },
        { id: '3', name: '이영희', isReady: false, isHost: false },
    ]); */

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!chatInput.trim()) return;
        socketRef.current?.emit('send_message', { roomId, userId, userName, message: chatInput.trim() });
        setChatInput('');
    };

    const handleReady = () => {
        const nextReadyState = !isReady;
        setIsReady(nextReadyState);
        socketRef.current?.emit('player_ready', { roomId, userId, isReady: nextReadyState });
    }

    return (
        <div className="min-h-screen common-bg-style text-white flex flex-col">
            <nav className="p-6 border-b border-[#615c5c] common-bg-style flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-[#FFD700] text-black px-3 py-1 rounded-md font-black text-xs">ROOM</div>
                    <h2 className="text-xl font-bold tracking-tight">{currentRoom?.name ?? `${params.id}번 방`}</h2>
                </div>
                <button
                    onClick={() => { socketRef.current?.emit('leave_room', { roomId, userId }); router.push('/rooms'); }}
                    className="text-white-500 hover:text-white transition-colors text-sm font-medium"
                >나가기</button>
            </nav>

            <div className="flex-1 flex flex-col lg:flex-row p-4 md:p-8 gap-6 max-w-7xl mx-auto w-full">
                {/* 왼쪽: 플레이어 리스트 */}
                <div className="flex-[1.5] space-y-4">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <User size={18}></User>
                        <span className="text-sm font-bold uppercase tracking-wider">Players ({players.length}/{currentRoom?.capacity ?? '-'})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                        {players.map((player) => {
                            return (
                                <motion.div
                                    key={player.userId}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className={`p-5 rounded-2xl border flex items-center justify-between ${player.isReady ? 'border-green-500/50 bg-green-500/5' : 'border-[#333] bg-[#272d24]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${player.isHost ? 'bg-[#FFD700] text-black' : 'bg-[#333] text-gray-300'}`}>
                                            {player.userName[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{player.userName}</span>
                                                {player.isHost && <ShieldCheck size={14} className="text-[#FFD700]" />}
                                            </div>
                                            <span className="text-xs text-gray-500">{player.isHost ? '방장' : '플레이어'}</span>
                                        </div>
                                    </div>
                                    {player.isReady && (
                                        <div className="flex items-center gap-1 text-green-500 text-sm font-bold">
                                            <CheckCircle2 size={16} /> READY
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* 오른쪽: 채팅 및 컨트롤러 */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* 채팅창 */}
                    <div className="bg-[#272d24] border border-[#333] rounded-3xl flex-1 min-h-[300px] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-[#615c5c] flex items-center gap-2 text-gray-400">
                            <MessageSquare size={16} />
                            <span className="text-xs font-bold uppercase">Lobby Chat</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">대화가 없습니다. 전략을 세워보세요!</p>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMine = msg.userId === userId;
                                    return (
                                        <div key={i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                            {!isMine && (
                                                <span className="text-xs text-gray-500 mb-1 ml-1">{msg.userName}</span>
                                            )}
                                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMine ? 'bg-[#FFD700] text-black' : 'bg-[#333] text-white'}`}>
                                                {msg.message}
                                            </div>
                                            <span className="text-[10px] text-gray-600 mt-1 mx-1">{msg.time}</span>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t border-[#333]">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="메시지를 입력하세요..."
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-[#FFD700]"
                            />
                        </div>
                    </div>

                    {/* 준비 시작 버튼 섹션 */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleReady()}
                            className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all active:scale-95 ${isReady ? 'bg-green-600 text-white' : 'bg-[#333] text-gray-300 hover:bg-[#444]'
                                }`}
                        >
                            {isReady ? 'READY!' : '준비하기'}
                        </button>
                        {/* 방장에게만 보이는 시작 버튼 */}
                        {players.find((p) => p.userId === userId)?.isHost && (
                            <button>
                                <PlayIcon size={30} fill="black" /> START
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}