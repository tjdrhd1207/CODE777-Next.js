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
    const [answerResult, setAnswerResult] = useState<{ userId: string; correct: boolean } | null>(null);

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

        socket.on('game_started', (data: GameState) => {
            setGameState(data);
            setActiveTurnId(data.currentTurn);
            setGamePhase('playing');
        });

        socket.on('turn_changed', (data: { currentTurn: string; question: { seq: number; question: string }; answer: string | number }) => {
            setActiveTurnId(data.currentTurn);
            setCurrentQuestion(data.question);
            setCurrentAnswer(data.answer);
        });

        socket.on('answer_result', (data: { userId: string; correct: boolean; scores: Record<string, number> }) => {
            setAnswerResult({ userId: data.userId, correct: data.correct });
            setGameState(prev => prev ? { ...prev, scores: data.scores } : prev);
            setTimeout(() => setAnswerResult(null), 3000);
        });

        socket.on('stands_updated', (data: { visibleStands: Record<string, Tile[]> }) => {
            setGameState(prev => prev ? { ...prev, visibleStands: data.visibleStands } : prev);
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
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomId, userId]);

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
        answerResult,
        sendMessage,
        handleReady,
        submitAnswer,
    };
}
