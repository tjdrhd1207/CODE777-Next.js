'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';

export type Tile = { value: number; color: string; image: string };
export type PlayerOrder = { userId: string; userName: string };
export type GameState = {
    visibleStands: Record<string, Tile[]>;
    scores: Record<string, number>;
    currentTurn: string;
    playerOrder: PlayerOrder[];
};

export function useGameSocket({ roomId, userId, userName }: {
    roomId: string | string[];
    userId: string;
    userName: string;
}) {
    const socketRef = useRef<Socket | null>(null);
    const [players, setPlayers] = useState<{ userId: string; userName: string; isReady: boolean; isHost: boolean }[]>([]);
    const [messages, setMessages] = useState<{ userId: string; userName: string; message: string; time: string }[]>([]);
    const [gamePhase, setGamePhase] = useState<'lobby' | 'playing'>('lobby');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<{ seq: number; question: string } | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState<string | number | null>(null);
    const [activeTurnId, setActiveTurnId] = useState<string>('');
    const [turnTimeLeft, setTurnTimeLeft] = useState<number>(60);
    const turnDeadlineRef = useRef<number>(0);
    const [answerResult, setAnswerResult] = useState<{ userId: string; correct: boolean } | null>(null);
    const [gameOver, setGameOver] = useState<{ winnerId: string; winnerName: string; scores: Record<string, number> } | null>(null);
    const [shufflePhase, setShufflePhase] = useState<'idle' | 'collecting' | 'shuffling' | 'dealing'>('idle');
    const pendingStandsRef = useRef<Record<string, Tile[]> | null>(null);

    useEffect(() => {
        const socket = io('http://localhost:3000');
        socketRef.current = socket;

        socket.on('update_player_list', (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('connect', () => {
            socket.emit('join_room', { roomId, userId, userName });
        });

        socket.on('game_started', (data: GameState & { turnDeadline?: number; question?: { seq: number; question: string }; answer?: string | number }) => {
            setGameState(data);
            setActiveTurnId(data.currentTurn);
            if (data.question !== undefined) setCurrentQuestion(data.question);
            if (data.answer !== undefined) setCurrentAnswer(data.answer);
            if (data.turnDeadline) turnDeadlineRef.current = data.turnDeadline;
            setGamePhase('playing');
        });

        socket.on('turn_changed', (data: { currentTurn: string; question: { seq: number; question: string }; answer: string | number; turnDeadline?: number }) => {
            setActiveTurnId(data.currentTurn);
            setCurrentQuestion(data.question);
            setCurrentAnswer(data.answer);
            if (data.turnDeadline) turnDeadlineRef.current = data.turnDeadline;
        });

        socket.on('answer_result', (data: { userId: string; correct: boolean; scores: Record<string, number> }) => {
            setAnswerResult({ userId: data.userId, correct: data.correct });
            setGameState(prev => prev ? { ...prev, scores: data.scores } : prev);

            // 애니메이션 시퀀스 (순차적):
            // 0ms       : 정답/오답 오버레이 + collecting (오버레이 뒤에서 진행)
            // 400ms     : shuffling (오버레이 뒤에서 대기)
            // 2500ms    : 오버레이 사라짐 → 셔플 오버레이만 노출
            // 3300ms    : 새 타일 적용 + dealing 애니메이션
            // 4000ms    : idle
            setShufflePhase('collecting');
            setTimeout(() => setShufflePhase('shuffling'), 400);
            setTimeout(() => setAnswerResult(null), 2500);
            setTimeout(() => {
                const stands = pendingStandsRef.current;
                pendingStandsRef.current = null;
                if (stands) {
                    setGameState(prev => prev ? { ...prev, visibleStands: stands } : prev);
                }
                setShufflePhase('dealing');
            }, 3300);
            setTimeout(() => setShufflePhase('idle'), 4000);
        });

        socket.on('stands_updated', (data: { visibleStands: Record<string, Tile[]> }) => {
            // answer_result 흐름에서만 발생하므로 항상 버퍼링 → answer_result 타이머가 적용
            pendingStandsRef.current = data.visibleStands;
        });

        socket.on('game_over', (data: { winnerId: string; winnerName: string; scores: Record<string, number> }) => {
            setGameOver(data);
        });

        return () => {
            socket.emit('leave_room', { roomId, userId });
            socket.off('update_player_list');
            socket.off('receive_message');
            socket.off('connect');
            socket.off('game_started');
            socket.off('turn_changed');
            socket.off('answer_result');
            socket.off('stands_updated');
            socket.off('game_over');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomId, userId]);

    // 1초마다 남은 시간 계산
    useEffect(() => {
        const interval = setInterval(() => {
            if (!turnDeadlineRef.current) return;
            const left = Math.max(0, Math.ceil((turnDeadlineRef.current - Date.now()) / 1000));
            setTurnTimeLeft(left);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const sendMessage = (message: string) => {
        socketRef.current?.emit('send_message', { roomId, userId, userName, message });
    };

    const handleReady = (isReady: boolean) => {
        socketRef.current?.emit('player_ready', { roomId, userId, isReady });
    };

    const submitAnswer = (values: number[]) => {
        socketRef.current?.emit('submit_answer', { roomId, values });
    };

    return {
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
    };
}
