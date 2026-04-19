import { motion } from "framer-motion";
import { User, Users, X } from "lucide-react";
import { useState } from "react";

interface CreateRoomModalProps {
    onClose: () => void;
    onCreate: (roomData: { title: string, maxPlayers: number }) => void;
}

export default function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
    const [title, setTitle] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(3);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!title.trim()) return alert('방 제목을 입력해주세요');
        onCreate({ title, maxPlayers });
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 배경 오버레이 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}

                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />

            {/* 모달 본체 */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bg-[#1a1a1a] border border-[#333] rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
                <div className="p-8 md:p-10">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black text-white tracking-tight">방 만들기</h2>
                        <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* 방 제목 입력 */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                                Room Title
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="친구들과 함께할 방 제목을 입력하세요"
                                className="w-full bg-[#111] border border-[#333] rounded-2xl p-4 text-white focus:outline-none focus:border-[#FFD700] transition-all"
                            />
                        </div>

                        {/* 인원수 선택 */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                                Max Players
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[2, 3, 4].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        disabled={num === 2 || num === 4}
                                        onClick={() => setMaxPlayers(num)}
                                        className={`py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 border-2 transition-all 
                                            ${maxPlayers === num
                                                ? 'border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]'
                                                : 'border-[#333] bg-[#111] text-gray-500 hover:border-[#444]'
                                            }
                                            /* 비활성화 스타일*/
                                            disabled:opacity-20 
                                            disabled:cursor-not-allowed 
                                            disabled:hover:border-[#333] 
                                            disabled:grayscale
                                            `}
                                    >
                                        <Users size={20} />
                                        <span>{num}인</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 하단 버튼 */}
                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 rounded-2xl font-bold bg-[#333] text-gray-300 hover:bg-[#444] transition-all"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] py-4 rounded-2xl font-black bg-[#FFD700] text-black hover:bg-[#ffeb3b] shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-all active:scale-95"
                            >
                                방 생성 및 입장
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}