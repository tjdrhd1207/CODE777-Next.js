'use client';

import { useUserStore } from '@/app/store/useUserStore';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
    const router = useRouter();
    const { login } = useUserStore();

    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const reqEnterEvt = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            callAuth('login');
        }
    }

    const callAuth = async (action: 'login' | 'signup') => {
        if (!userId.trim() || !password.trim()) {
            setError('아이디와 비밀번호를 입력해주세요.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userId, password, action }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.message || (action === 'login' ? '로그인에 실패했습니다.' : '회원가입에 실패했습니다.'));
                return;
            }
            if (action === 'signup') {
                setSuccess('회원가입이 완료되었습니다. 로그인해주세요.');
                return;
            }
            login(data.user.id, String(data.user.id));
            router.push('/rooms');
        } catch {
            setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
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
        <h2 className="text-3xl font-black text-white mb-8 text-center tracking-tight">
            로그인
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">아이디</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={reqEnterEvt}
              className="w-full bg-[#111] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] transition-all"
              placeholder="Username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">패스워드</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={reqEnterEvt}
              placeholder="••••••••"
              className="w-full bg-[#111] border border-[#333] rounded-xl p-4 text-white focus:outline-none focus:border-[#E63946] focus:ring-1 focus:ring-[#E63946] transition-all"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#E63946] text-sm font-medium text-center bg-[#E63946]/10 border border-[#E63946]/30 rounded-xl px-4 py-3"
            >
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-400 text-sm font-medium text-center bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3"
            >
              {success}
            </motion.p>
          )}
        </div>

        {/* 버튼 그룹 */}
        <div className="grid grid-cols-3 gap-3 mt-10">
          <button
            onClick={() => callAuth('signup')}
            disabled={isLoading}
            className="bg-[#457b9d] text-white py-4 rounded-xl font-bold hover:bg-[#5a8bad] active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            생성
          </button>
          <button
            onClick={() => callAuth('login')}
            disabled={isLoading}
            className="bg-[#1d3557] text-white py-4 rounded-xl font-bold hover:bg-[#2a4a75] active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : '로그인'}
          </button>
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