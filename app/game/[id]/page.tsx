'use client';

import { CheckCircle2, MessageSquare, PlayIcon, ShieldCheck, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from 'framer-motion';
import { useUserStore } from "../../store/useUserStore";
import { useGameStore } from "../../store/useGameStore";
import { useGameSocket } from "../../hooks/useGameSocket";
import { PlayerStand } from "../../components/game/PlayerStand";

export default function GameLobbyPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id;
    const { userId, userName } = useUserStore();
    const { currentRoom } = useGameStore();
    const [isReady, setIsReady] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const {
        socketRef,
        players,
        messages,
        gamePhase,
        gameState,
        currentQuestion,
        currentAnswer,
        activeTurnId,
        turnTimeLeft,
        answerResult,
        gameOver,
        shufflePhase,
        sendMessage,
        handleReady,
        submitAnswer,
    } = useGameSocket({ roomId: roomId ?? '', userId: userId || '', userName: userName || '' });

    const [showAnswerModal, setShowAnswerModal] = useState(false);
    const [guesses, setGuesses] = useState<[number, number, number]>([1, 1, 1]);
    const [isDealing, setIsDealing] = useState(false);

    // 게임 시작 직후 딜 애니메이션 트리거
    useEffect(() => {
        if (gamePhase === 'playing') {
            setIsDealing(true);
            const t = setTimeout(() => setIsDealing(false), 600);
            return () => clearTimeout(t);
        }
    }, [gamePhase]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const onSendMessage = () => {
        if (!chatInput.trim()) return;
        sendMessage(chatInput.trim());
        setChatInput('');
    };

    const onReady = () => {
        const next = !isReady;
        setIsReady(next);
        handleReady(next);
    };

    // ── 게임 종료 화면 ───────────────────────────────────────
    if (gameOver) {
        const isWinner = gameOver.winnerId === userId;
        return (
            <div className="min-h-screen common-bg-style text-white flex flex-col items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-5xl">{isWinner ? '🏆' : '😢'}</p>
                    <h1 className="text-4xl font-black text-[#FFD700]">
                        {isWinner ? '승리!' : '패배'}
                    </h1>
                    <p className="text-gray-400 text-lg">
                        <span className="text-white font-bold">{gameOver.winnerName}</span> 님이 3점을 달성했습니다
                    </p>
                </div>

                <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-6 w-72">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">최종 점수</h2>
                    <div className="flex flex-col gap-3">
                        {Object.entries(gameOver.scores)
                            .sort(([, a], [, b]) => b - a)
                            .map(([uid, score]) => {
                                const pName = gameState?.playerOrder.find(p => p.userId === uid)?.userName ?? uid;
                                return (
                                    <div key={uid} className="flex justify-between items-center">
                                        <span className={`font-bold ${uid === gameOver.winnerId ? 'text-[#FFD700]' : 'text-gray-300'}`}>
                                            {uid === gameOver.winnerId ? '👑 ' : ''}{pName}
                                        </span>
                                        <span className="text-xl font-black text-[#FFD700]">{score}</span>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                <button
                    onClick={() => router.push('/rooms')}
                    className="px-8 py-4 rounded-2xl font-black text-lg bg-[#FFD700] text-black hover:bg-yellow-400 transition-all active:scale-95"
                >
                    로비로 돌아가기
                </button>
            </div>
        );
    }

    // ── 게임 화면 ────────────────────────────────────────────
    if (gamePhase === 'playing' && gameState) {
        const npcTiles = gameState.visibleStands['npc'] || [];
        const others = gameState.playerOrder.filter(p => p.userId !== userId);
        const selfName = gameState.playerOrder.find(p => p.userId === userId)?.userName || userName || '';
        const activeTurn = activeTurnId || gameState.currentTurn;
        const isMyTurn = activeTurn === userId;

        // shufflePhase → 각 위치 방향 매핑
        const collectDirs = {
            top:    shufflePhase === 'collecting' ? 'top'    : undefined,
            left:   shufflePhase === 'collecting' ? 'left'   : undefined,
            right:  shufflePhase === 'collecting' ? 'right'  : undefined,
            bottom: shufflePhase === 'collecting' ? 'bottom' : undefined,
        } as const;
        const dealDirs = {
            top:    (isDealing || shufflePhase === 'dealing') ? 'top'    : undefined,
            left:   (isDealing || shufflePhase === 'dealing') ? 'left'   : undefined,
            right:  (isDealing || shufflePhase === 'dealing') ? 'right'  : undefined,
            bottom: (isDealing || shufflePhase === 'dealing') ? 'bottom' : undefined,
        } as const;

        return (
            <div className="min-h-screen common-bg-style text-white flex flex-col items-center justify-between p-4 gap-4">
                {/* NPC — 상단 */}
                <PlayerStand
                    name="NPC"
                    tiles={npcTiles}
                    isTurn={activeTurn === 'npc'}
                    collectDir={collectDirs.top}
                    dealDir={dealDirs.top}
                />

                {/* 중간 행: 왼쪽 플레이어 | 질문 패널 | 오른쪽 플레이어 */}
                <div className="flex items-center justify-center gap-6 w-full max-w-4xl">
                    <div className="flex-1 flex justify-end">
                        {others[0] && (
                            <PlayerStand
                                name={others[0].userName}
                                tiles={gameState.visibleStands[others[0].userId] || []}
                                isTurn={activeTurn === others[0].userId}
                                collectDir={collectDirs.left}
                                dealDir={dealDirs.left}
                            />
                        )}
                    </div>

                    {/* 중앙 질문/정답/점수 패널 */}
                    <div className="flex-[1.5] flex flex-col items-center gap-3">
                        <div className="w-full bg-[#1a2a1a] border border-[#FFD700]/30 rounded-2xl p-4 text-center min-h-[120px] flex flex-col items-center justify-center gap-2">
                            {currentQuestion ? (
                                <>
                                    <p className="text-xs text-[#FFD700] font-bold uppercase tracking-widest">Q{currentQuestion.seq}</p>
                                    <p className="text-sm text-white leading-relaxed">{currentQuestion.question}</p>
                                    {currentAnswer !== null && (
                                        <p className="text-2xl font-black text-[#FFD700]">{currentAnswer}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-500 text-sm">질문 카드 대기 중...</p>
                            )}
                        </div>
                        <div className="flex gap-4">
                            {gameState.playerOrder.map(p => (
                                <div key={p.userId} className="flex flex-col items-center">
                                    <span className="text-[10px] text-gray-400">{p.userName}</span>
                                    <span className="text-lg font-black text-[#FFD700]">{gameState.scores[p.userId] ?? 0}</span>
                                </div>
                            ))}
                        </div>

                        {/* 턴 타이머 */}
                        <div className="w-full flex flex-col items-center gap-1">
                            <span className={`text-2xl font-black tabular-nums ${turnTimeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                                {turnTimeLeft}
                            </span>
                            <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${turnTimeLeft <= 10 ? 'bg-red-400' : 'bg-[#FFD700]'}`}
                                    style={{ width: `${(turnTimeLeft / 60) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-start">
                        {others[1] && (
                            <PlayerStand
                                name={others[1].userName}
                                tiles={gameState.visibleStands[others[1].userId] || []}
                                isTurn={activeTurn === others[1].userId}
                                collectDir={collectDirs.right}
                                dealDir={dealDirs.right}
                            />
                        )}
                    </div>
                </div>

                {/* 본인 받침대 (뒷면) + 버튼 — 하단 */}
                <div className="flex flex-col items-center gap-4">
                    <PlayerStand
                        name={`${selfName} (나)`}
                        tiles={[]}
                        isTurn={isMyTurn}
                        isBack
                        collectDir={collectDirs.bottom}
                        dealDir={dealDirs.bottom}
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => socketRef.current?.emit('next_turn', { roomId })}
                            disabled={!isMyTurn}
                            className="px-6 py-3 rounded-xl font-bold text-sm bg-[#FFD700] text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-400 transition-all active:scale-95"
                        >
                            다음 턴
                        </button>
                        <button
                            onClick={() => setShowAnswerModal(true)}
                            disabled={!isMyTurn}
                            className="px-6 py-3 rounded-xl font-bold text-sm bg-white/10 border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all active:scale-95"
                        >
                            정답 도전
                        </button>
                    </div>
                </div>

                {/* 정답 도전 모달 */}
                {showAnswerModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-[#1a2a1a] border border-[#FFD700]/40 rounded-3xl p-8 w-80 flex flex-col gap-6">
                            <h2 className="text-lg font-black text-[#FFD700] text-center">내 타일 숫자를 맞혀보세요</h2>
                            <div className="flex justify-center gap-4">
                                {([0, 1, 2] as const).map(i => (
                                    <select
                                        key={i}
                                        value={guesses[i]}
                                        onChange={e => {
                                            const next: [number, number, number] = [...guesses];
                                            next[i] = Number(e.target.value);
                                            setGuesses(next);
                                        }}
                                        className="w-16 h-16 text-2xl font-black text-center rounded-xl bg-[#0a0a0a] border-2 border-[#FFD700]/50 text-white focus:outline-none focus:border-[#FFD700]"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAnswerModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#333] text-gray-300 hover:bg-[#444] transition-all"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => { submitAnswer(guesses); setShowAnswerModal(false); }}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#FFD700] text-black hover:bg-yellow-400 transition-all"
                                >
                                    제출
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 정답/오답 결과 오버레이 */}
                {answerResult && (
                    <div className="answer-overlay">
                        <div className="answer-box">
                            <p className="text-gray-400 text-base mb-3">
                                {gameState.playerOrder.find(p => p.userId === answerResult.userId)?.userName ?? answerResult.userId}의 도전!
                            </p>
                            <p className={`answer-result ${answerResult.correct ? 'correct' : 'wrong'}`}>
                                {answerResult.correct ? '정답!' : '오답'}
                            </p>
                            {answerResult.correct && (
                                <p className="text-green-400 text-sm mt-3">+1점 획득</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 셔플 오버레이 */}
                {shufflePhase === 'shuffling' && (
                    <div className="shuffle-overlay">
                        <div className="shuffle-deck">
                            {[
                                { cx: '-18px', cr: '-12deg', delay: '0s' },
                                { cx: '-9px',  cr: '-6deg',  delay: '0.05s' },
                                { cx: '0px',   cr: '0deg',   delay: '0.1s' },
                                { cx: '9px',   cr: '6deg',   delay: '0.15s' },
                                { cx: '18px',  cr: '12deg',  delay: '0.2s' },
                            ].map((s, i) => (
                                <div
                                    key={i}
                                    className="shuffle-deck-card"
                                    style={{ '--cx': s.cx, '--cr': s.cr, animationDelay: s.delay } as React.CSSProperties}
                                >
                                    {i === 2 ? '?' : ''}
                                </div>
                            ))}
                        </div>
                        <p className="shuffle-label">패 교체 중...</p>
                    </div>
                )}
            </div>
        );
    }

    // ── 로비 화면 ────────────────────────────────────────────
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
                        <User size={18} />
                        <span className="text-sm font-bold uppercase tracking-wider">Players ({players.length}/{currentRoom?.capacity ?? '-'})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                        {players.map((player) => (
                            <motion.div
                                key={player.userId}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className={`p-5 rounded-2xl border flex items-center justify-between ${player.isReady ? 'border-green-500/50 bg-green-500/5' : 'border-[#333] bg-[#272d24]'}`}
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
                        ))}
                    </div>
                </div>

                {/* 오른쪽: 채팅 및 버튼 */}
                <div className="flex-1 flex flex-col gap-6">
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
                                            {!isMine && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.userName}</span>}
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
                                onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                                placeholder="메시지를 입력하세요..."
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-[#FFD700]"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onReady}
                            className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all active:scale-95 ${isReady ? 'bg-green-600 text-white' : 'bg-[#333] text-gray-300 hover:bg-[#444]'}`}
                        >
                            {isReady ? 'READY!' : '준비하기'}
                        </button>
                        {players.find((p) => p.userId === userId)?.isHost && players.length === 3 && (
                            <button
                                onClick={() => socketRef.current?.emit('start_game', { roomId })}
                                className="flex items-center gap-2 px-6 py-5 rounded-2xl bg-[#FFD700] text-black font-black text-lg hover:bg-yellow-400 transition-all active:scale-95"
                            >
                                <PlayIcon size={24} fill="black" /> START
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
