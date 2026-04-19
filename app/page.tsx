'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from './components/auth/LoginModal';
/* import LoginModal from '@/components/auth/LoginModal'; */

export default function StartPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#121212] overflow-hidden common-bg-style">
      {/* 배경 장식 (선택 사항: 보드게임 느낌의 은은한 원형 광원) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1e1e1e] via-[#121212] to-[#0a0a0a] z-0" />

      {/* 타이틀 영역 */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 mb-20 text-center"
      >
        <h1 className="text-8xl md:text-9xl font-black text-[#FFD700] tracking-[0.2em] drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]">
          CODE 777
        </h1>
        <p className="text-gray-500 mt-4 tracking-[0.5em] font-medium uppercase">Logic & Deduction</p>
      </motion.div>

      {/* 메인 메뉴 그룹 */}
      <div className="relative z-10 flex flex-col gap-5 w-72">
        <MenuButton 
          label="시작" 
          primary 
          onClick={() => setIsModalOpen(true)} 
        />
        <MenuButton label="Rule" />
        <MenuButton label="만든사람" />
      </div>

      {/* 로그인 모달 레이어 */}
      <AnimatePresence>
        {isModalOpen && (
          <LoginModal onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>

      {/* 하단 카피라이트 */}
      <footer className="absolute bottom-8 text-white text-sm tracking-widest">
        © 2026 CODE 777 PROJECT created by GEGU
      </footer>
    </main>
  );
}

// 메뉴 버튼 내부 컴포넌트
function MenuButton({ label, primary, onClick }: { label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, backgroundColor: primary ? '#ff4d6d' : '#252525' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`py-4 px-8 rounded-xl font-bold text-xl transition-all border-2 cursor-pointer
        ${primary 
          ? 'bg-[#E63946] border-[#FF4D6D] text-white shadow-[0_0_15px_rgba(230,57,70,0.4)]' 
          : 'bg-[#1E1E1E] border-[#333] text-gray-300'}`}
    >
      {label}
    </motion.button>
  );
}