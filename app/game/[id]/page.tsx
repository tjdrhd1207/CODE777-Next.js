'use client';

import { CheckCircle2, MessageSquare, PlayIcon, ShieldCheck, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from 'framer-motion';
import { useUserStore } from "../../store/useUserStore";
import { useGameStore } from "../../store/useGameStore";
import { useGameSocket } from "../../hooks/useGameSocket";
import { PlayerStand } from "../../components/game/PlayerStand";

type QuizQ =
    | { seq: number; label: string; type: 'number' }
    | { seq: number; label: string; type: 'choice'; a: string; b: string };

const QUIZ_QUESTIONS: QuizQ[] = [
    { seq: 1,  label: '숫자의 합이 18 이상인 받침대는 몇 개입니까?',   type: 'number' },
    { seq: 2,  label: '숫자의 합이 12 이하인 받침대는 몇 개입니까?',   type: 'number' },
    { seq: 3,  label: '숫자는 같고 색깔은 다른 타일이 있는 받침대는 몇 개입니까?',    type: 'number' },
    { seq: 4,  label: '3개의 타일이 모두 색깔이 다른 받침대는 몇 개입니까?', type: 'number' },
    { seq: 5,  label: '짝수만 있거나 홀수만 있는 받침대는 몇 개입니까?',     type: 'number' },
    { seq: 6,  label: '색깔과 숫자 모두 완전히 같은 타일이 있는 받침대는 몇 개입니까?', type: 'number' },
    { seq: 7,  label: '3개의 타일이 연속된 숫자인 받침대는 몇 개입니까?',       type: 'number' },
    { seq: 8,  label: '몇 가지 색깔이 보입니까?',      type: 'number' },
    { seq: 9,  label: '3번 이상 보이는 색깔은 몇 개입니까?',     type: 'number' },
    { seq: 10, label: '하나도 보이지 않는 숫자는 몇 개입니까?',    type: 'number' },
    { seq: 11, label: '녹색 1, 검정 5, 분홍 7이 총 몇 개 보입니까?', type: 'number' },
    { seq: 12, label: '3과 분홍6 중에서 어느 것이 더 많이 보입니까?',       type: 'choice', a: '3',   b: '분6'  },
    { seq: 13, label: '녹색 6과 노랑 7 중에서 어느 것이 더 많이 보입니까?',       type: 'choice', a: '녹6', b: '노7'  },
    { seq: 14, label: '노랑 2와 노랑 7 중에서 어느 것이 더 많이 보입니까?',       type: 'choice', a: '노2', b: '노7'  },
    { seq: 15, label: '분홍 6과 노랑 6 중에서 어느 것이 더 많이 보입니까?',       type: 'choice', a: '분6', b: '노6'  },
    { seq: 16, label: '파랑 7과 다른 색깔 7 중에서 어느 것이 더 많이 보입니까?',     type: 'choice', a: '파7', b: '다른7'},
    { seq: 17, label: '갈색 vs 파랑',     type: 'choice', a: '갈색', b: '파랑'},
    { seq: 18, label: '빨강 vs 분홍',     type: 'choice', a: '빨강', b: '분홍'},
    { seq: 19, label: '녹색 vs 파랑',     type: 'choice', a: '녹색', b: '파랑'},
    { seq: 20, label: '노랑 vs 분홍',     type: 'choice', a: '노랑', b: '분홍'},
    { seq: 21, label: '검정 vs 갈색',     type: 'choice', a: '검정', b: '갈색'},
    { seq: 22, label: '검정 vs 빨강',     type: 'choice', a: '검정', b: '빨강'},
    { seq: 23, label: '녹색 vs 노랑',     type: 'choice', a: '녹색', b: '노랑'},
];

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
    const [questionDeckPhase, setQuestionDeckPhase] = useState<'idle' | 'shuffling' | 'drawing' | 'visible'>('idle');
    const firstQTriggered = useRef(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'memo' | 'logic'>('memo');
    const [memoText, setMemoText] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem(`memo_${String(roomId)}`) ?? '') : ''
    );
    const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`quiz_${String(roomId)}`);
            if (saved) try { return JSON.parse(saved); } catch { /* ignore */ }
        }
        return {};
    });

    // 게임 시작 직후 딜 애니메이션 트리거
    useEffect(() => {
        if (gamePhase === 'playing') {
            setIsDealing(true);
            const t = setTimeout(() => setIsDealing(false), 600);
            return () => clearTimeout(t);
        }
    }, [gamePhase]);

    useEffect(() => {
        localStorage.setItem(`memo_${String(roomId)}`, memoText);
    }, [memoText]);

    useEffect(() => {
        localStorage.setItem(`quiz_${String(roomId)}`, JSON.stringify(quizAnswers));
    }, [quizAnswers]);

    // 첫 질문 도착 시 힌트덱 셔플 → 드로우 애니메이션
    useEffect(() => {
        if (gamePhase === 'playing' && currentQuestion && !firstQTriggered.current) {
            firstQTriggered.current = true;
            setQuestionDeckPhase('shuffling');
            const t1 = setTimeout(() => setQuestionDeckPhase('drawing'), 1200);
            const t2 = setTimeout(() => setQuestionDeckPhase('visible'), 1650);
            const t3 = setTimeout(() => setQuestionDeckPhase('idle'), 2100);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
    }, [gamePhase, currentQuestion]);

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

    const getCharSrc = (idx: number) => `/assets/card/character_${idx + 1}.png`;

    // ── 게임 화면 ────────────────────────────────────────────
    if (gamePhase === 'playing' && gameState) {
        const npcTiles = gameState.visibleStands['npc'] || [];
        const others = gameState.playerOrder.filter(p => p.userId !== userId);
        const selfName = gameState.playerOrder.find(p => p.userId === userId)?.userName || userName || '';
        const activeTurn = activeTurnId || gameState.currentTurn;
        const isMyTurn = activeTurn === userId;
        const selfIdx = gameState.playerOrder.findIndex(p => p.userId === userId);

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

        const centerPanel = (
            <div className="flex flex-col items-center gap-3 w-full">
                <div className="w-full bg-[#1a2a1a] border border-[#FFD700]/30 rounded-2xl p-3 md:p-4 text-center min-h-[100px] md:min-h-[120px] flex flex-col items-center justify-center gap-2">
                    {questionDeckPhase === 'shuffling' && (
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative w-10 h-14 md:w-14 md:h-20">
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        className="absolute w-10 h-14 md:w-14 md:h-20 rounded-xl bg-[#1a1a3e] border-2 border-[#FFD700]/70 q-deck-card"
                                        style={{ top: `${-i * 3}px`, left: `${i * 2}px`, zIndex: i, animationDelay: `${i * 0.09}s` }}
                                    />
                                ))}
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <span className="text-[#FFD700] text-xl md:text-2xl font-black">?</span>
                                </div>
                            </div>
                            <p className="text-[#FFD700] text-xs font-bold animate-pulse">힌트 카드 섞는 중...</p>
                        </div>
                    )}
                    {questionDeckPhase === 'drawing' && (
                        <div className="w-10 h-14 md:w-14 md:h-20 rounded-xl bg-[#1a1a3e] border-2 border-[#FFD700] flex items-center justify-center q-card-draw">
                            <span className="text-[#FFD700] text-xl md:text-2xl font-black">?</span>
                        </div>
                    )}
                    {(questionDeckPhase === 'visible' || questionDeckPhase === 'idle') && currentQuestion && (
                        <div className={questionDeckPhase === 'visible' ? 'q-reveal' : ''}>
                            <p className="text-xs text-[#FFD700] font-bold uppercase tracking-widest">Q{currentQuestion.seq}</p>
                            <p className="text-sm text-white leading-relaxed mt-1">{currentQuestion.question}</p>
                            {currentAnswer !== null && (
                                <p className="text-2xl font-black text-[#FFD700] mt-1">{currentAnswer}</p>
                            )}
                        </div>
                    )}
                    {questionDeckPhase === 'idle' && !currentQuestion && (
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
        );

        return (
            <div className="min-h-screen common-bg-style text-white flex flex-col items-center justify-between pt-4 px-2 md:px-4 pb-12 gap-2 md:gap-4">
                {/* NPC — 상단 */}
                <PlayerStand
                    name="NPC"
                    tiles={npcTiles}
                    isTurn={activeTurn === 'npc'}
                    collectDir={collectDirs.top}
                    dealDir={dealDirs.top}
                    characterImg={getCharSrc(3)}
                />

                {/* 데스크톱: 왼쪽 플레이어 | 질문 패널 | 오른쪽 플레이어 */}
                <div className="hidden md:flex items-center justify-center gap-6 w-full max-w-4xl">
                    <div className="flex-1 flex justify-end">
                        {others[0] && (
                            <PlayerStand
                                name={others[0].userName}
                                tiles={gameState.visibleStands[others[0].userId] || []}
                                isTurn={activeTurn === others[0].userId}
                                collectDir={collectDirs.left}
                                dealDir={dealDirs.left}
                                characterImg={getCharSrc(gameState.playerOrder.findIndex(p => p.userId === others[0].userId))}
                            />
                        )}
                    </div>
                    <div className="flex-[1.5] flex flex-col items-center gap-3">
                        {centerPanel}
                    </div>
                    <div className="flex-1 flex justify-start">
                        {others[1] && (
                            <PlayerStand
                                name={others[1].userName}
                                tiles={gameState.visibleStands[others[1].userId] || []}
                                isTurn={activeTurn === others[1].userId}
                                collectDir={collectDirs.right}
                                dealDir={dealDirs.right}
                                characterImg={getCharSrc(gameState.playerOrder.findIndex(p => p.userId === others[1].userId))}
                            />
                        )}
                    </div>
                </div>

                {/* 모바일: 질문 패널 → 다른 플레이어 */}
                <div className="flex md:hidden flex-col items-center gap-3 w-full">
                    {centerPanel}
                    {others.length > 0 && (
                        <div className="flex gap-3 justify-center flex-wrap">
                            {others[0] && (
                                <PlayerStand
                                    name={others[0].userName}
                                    tiles={gameState.visibleStands[others[0].userId] || []}
                                    isTurn={activeTurn === others[0].userId}
                                    collectDir={collectDirs.left}
                                    dealDir={dealDirs.left}
                                    characterImg={getCharSrc(gameState.playerOrder.findIndex(p => p.userId === others[0].userId))}
                                />
                            )}
                            {others[1] && (
                                <PlayerStand
                                    name={others[1].userName}
                                    tiles={gameState.visibleStands[others[1].userId] || []}
                                    isTurn={activeTurn === others[1].userId}
                                    collectDir={collectDirs.right}
                                    dealDir={dealDirs.right}
                                    characterImg={getCharSrc(gameState.playerOrder.findIndex(p => p.userId === others[1].userId))}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* 본인 받침대 (뒷면) + 버튼 — 하단 */}
                <div className="flex flex-col items-center gap-3 md:gap-4">
                    <PlayerStand
                        name={`${selfName} (나)`}
                        tiles={[]}
                        isTurn={isMyTurn}
                        isBack
                        collectDir={collectDirs.bottom}
                        dealDir={dealDirs.bottom}
                        characterImg={getCharSrc(selfIdx)}
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

                {/* 하단 메모 드로어 */}
                <div
                    className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out"
                    style={{ transform: drawerOpen ? 'translateY(0)' : 'translateY(calc(100% - 36px))' }}
                >
                    {/* 핸들 — 항상 노출 */}
                    <button
                        onClick={() => setDrawerOpen(prev => !prev)}
                        className="w-full flex items-center justify-center gap-2 bg-[#1a2a1a] border-t-2 border-[#FFD700]/50 py-2 hover:bg-[#243024] transition-colors"
                    >
                        <span className="text-[#FFD700] text-xs font-black tracking-widest uppercase">메모</span>
                        <span className="text-[#FFD700] text-[10px]">{drawerOpen ? '▼' : '▲'}</span>
                    </button>

                    {/* 드로어 본체 */}
                    <div className="bg-[#0d160d] border-t border-[#FFD700]/20">
                        {/* 탭 헤더 */}
                        <div className="flex items-center gap-1 px-4 pt-2 pb-0 border-b border-[#333]">
                            {(['memo', 'logic'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${
                                        activeTab === tab
                                            ? 'bg-[#1a2a1a] text-[#FFD700] border border-b-0 border-[#FFD700]/40'
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {tab === 'memo' ? '메모장' : '추론표'}
                                </button>
                            ))}
                        </div>

                        {/* 탭 내용 */}
                        <div className="h-48 overflow-y-auto p-3">
                            {/* 탭 1 — 자유 메모 */}
                            {activeTab === 'memo' && (
                                <textarea
                                    value={memoText}
                                    onChange={e => setMemoText(e.target.value)}
                                    placeholder="힌트 결과, 추측, 전략 등 자유롭게 적어보세요..."
                                    className="w-full h-full bg-transparent text-white text-sm leading-relaxed resize-none focus:outline-none placeholder:text-gray-600 font-mono"
                                />
                            )}

                            {/* 탭 2 — 질문 체크리스트 */}
                            {activeTab === 'logic' && (
                                <div className="flex flex-col divide-y divide-[#1a1a1a]">
                                    {QUIZ_QUESTIONS.map(q => {
                                        const isActive = currentQuestion?.seq === q.seq;
                                        const answer = quizAnswers[q.seq];
                                        return (
                                            <div
                                                key={q.seq}
                                                className={`flex items-center gap-2 py-1.5 ${isActive ? 'bg-[#FFD700]/10' : ''}`}
                                            >
                                                <span className={`text-[10px] font-black w-5 shrink-0 tabular-nums ${isActive ? 'text-[#FFD700]' : 'text-gray-600'}`}>
                                                    {q.seq}
                                                </span>
                                                <span className="text-[10px] text-gray-400 flex-1 truncate min-w-0">{q.label}</span>
                                                {q.type === 'number' ? (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => setQuizAnswers(prev => {
                                                                const cur = prev[q.seq];
                                                                if (!cur || cur === '0') { const n = { ...prev }; delete n[q.seq]; return n; }
                                                                return { ...prev, [q.seq]: String(Number(cur) - 1) };
                                                            })}
                                                            className="w-5 h-5 rounded bg-[#222] text-gray-400 text-xs hover:bg-[#333] flex items-center justify-center leading-none"
                                                        >−</button>
                                                        <span className={`w-5 text-center text-xs font-black tabular-nums ${answer !== undefined ? 'text-[#FFD700]' : 'text-gray-600'}`}>
                                                            {answer ?? '—'}
                                                        </span>
                                                        <button
                                                            onClick={() => setQuizAnswers(prev => {
                                                                const cur = prev[q.seq];
                                                                return { ...prev, [q.seq]: cur === undefined ? '0' : String(Number(cur) + 1) };
                                                            })}
                                                            className="w-5 h-5 rounded bg-[#222] text-gray-400 text-xs hover:bg-[#333] flex items-center justify-center leading-none"
                                                        >+</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        {[
                                                            { key: 'a', label: q.a },
                                                            { key: '=', label: '=' },
                                                            { key: 'b', label: q.b },
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.key}
                                                                onClick={() => setQuizAnswers(prev => {
                                                                    if (prev[q.seq] === opt.key) { const n = { ...prev }; delete n[q.seq]; return n; }
                                                                    return { ...prev, [q.seq]: opt.key };
                                                                })}
                                                                className={`h-5 px-1 rounded text-[9px] font-black transition-all ${
                                                                    answer === opt.key
                                                                        ? 'bg-[#FFD700] text-black'
                                                                        : 'bg-[#222] text-gray-400 hover:bg-[#333]'
                                                                }`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
                        {players.map((player, playerIdx) => (
                            <motion.div
                                key={player.userId}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className={`p-5 rounded-2xl border flex items-center justify-between ${player.isReady ? 'border-green-500/50 bg-green-500/5' : 'border-[#333] bg-[#272d24]'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`relative w-12 h-12 rounded-full overflow-hidden border-2 ${player.isHost ? 'border-[#FFD700]' : 'border-[#444]'}`}>
                                        <img src={getCharSrc(playerIdx)} alt={player.userName} className="w-full h-full object-cover" />
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
