'use client';

import { useUserStore } from '@/app/store/useUserStore';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
    const router = useRouter();
    const { login } = useUserStore();

    const reqEnterEvt = (e: KeyboardEvent) => {
        console.log(e);
        if (e.key === "Enter") {
            reqLogin();
        }
    }

    /* 로그인 요청 */
    const reqLogin = () => {
        // TODO
        // 1. fetch 로그인 API 호출

        // 2. 성공 가정

        // 3. Zustand 유저 정보 저장


        // 4. /rooms 페이지로 부드럽게 이동
        router.push('/rooms');
    }


    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 (클릭 시 닫힘) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
      />

      {/* 모달 본체 */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        className="relative w-full max-w-md bg-[#1e1e1e] border border-[#333] rounded-[2rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <h2 className="text-3xl font-black text-white mb-8 text-center tracking-tight"
        >
            로그인</h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">아이디</label>
            <input 
              type="text" 
              className="w-full bg-[#111] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] transition-all"
              placeholder="Username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">패스워드</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-[#111] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] transition-all"
              onKeyDown={(e) => reqEnterEvt(e as any)}
            />
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="grid grid-cols-3 gap-3 mt-10">
          <button className="bg-[#457b9d] text-white py-4 rounded-xl font-bold hover:bg-[#5a8bad] active:scale-95 transition-all text-sm">생성</button>
          <button className="bg-[#1d3557] text-white py-4 rounded-xl font-bold hover:bg-[#2a4a75] active:scale-95 transition-all text-sm">로그인</button>
          <button 
            onClick={onClose} 
            className="bg-[#333] text-gray-300 py-4 rounded-xl font-bold hover:bg-[#444] active:scale-95 transition-all text-sm"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
}