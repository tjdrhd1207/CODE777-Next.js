import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { Server } from 'socket.io';
import { generateDeck, shuffleDeck, QUESTION_CARDS } from './lib/cards.js';
import { evaluate, checkAnswer } from './lib/ruleEngine.js';
import { sql, poolPromise } from './lib/db.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// roomId -> [{ userId, userName, socketId, isReady, isHost }]
const rooms = new Map();
// socketId -> { roomId, userId }
const socketToRoom = new Map();
// roomId -> 게임 상태
const gameStates = new Map();
// socketId -> reconnect 대기 타이머
const reconnectTimers = new Map();
// roomId -> turn 대기 타이머
const turnTimers = new Map(); 

const TURN_TIMEOUT_MS = 60_000; // 60초
function clearTurnTimer(roomIdStr) {
    clearTimeout(turnTimers.get(roomIdStr));
    turnTimers.delete(roomIdStr);
}

function startTurnTimer(roomIdStr, io) {
    clearTurnTimer(roomIdStr);
    turnTimers.set(roomIdStr, setTimeout(() => {
        autoAdvanceTurn(roomIdStr, io);
    }, TURN_TIMEOUT_MS));
}

function autoAdvanceTurn(roomIdStr, io) {
    const gs = gameStates.get(roomIdStr);
    if (!gs || gs.status !== 'playing') return;

    gs.currentTurnIndex = (gs.currentTurnIndex + 1) % gs.playerOrder.length;

    if (gs.questionDeck.length === 0) {
        gs.questionDeck = shuffleDeck([...gs.questionDiscards]);
        gs.questionDiscards = [];
    }
    const question = gs.questionDeck.pop();
    gs.questionDiscards.push(question);

    const players = gs.playerOrder.map(uid => ({ userId: uid, hand: gs.stands[uid] || [] }));
    players.push({ userId: 'npc', hand: gs.stands['npc'] || [] });
    const answer = evaluate(question.seq, players, gs.currentTurnIndex);

    const turnDeadline = Date.now() + TURN_TIMEOUT_MS;
    io.to(roomIdStr).emit('turn_changed', {
        currentTurn: gs.playerOrder[gs.currentTurnIndex],
        question,
        answer,
        turnDeadline,
    });

    startTurnTimer(roomIdStr, io);
    console.log(`[auto-turn] ${roomIdStr} → ${gs.playerOrder[gs.currentTurnIndex]}, Q${question.seq}`);
}

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        cors: { origin: "*" }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_room', ({ roomId, userId, userName }) => {
            const roomIdStr = String(roomId);

            // 재연결 시 기존 disconnect 타이머 취소
            // (userId로 등록된 이전 socketId 타이머 탐색)
            for (const [sid, timer] of reconnectTimers.entries()) {
                const info = socketToRoom.get(sid);
                if (info?.userId === userId && info?.roomId === roomIdStr) {
                    clearTimeout(timer);
                    reconnectTimers.delete(sid);
                    socketToRoom.delete(sid);
                    console.log(`[reconnect] ${userId} 재연결 — 퇴장 타이머 취소`);
                    break;
                }
            }

            if (!rooms.has(roomIdStr)) {
                rooms.set(roomIdStr, []);
            }

            const players = rooms.get(roomIdStr);
            const isHost = players.length === 0;

            players.push({ userId, userName, socketId: socket.id, isReady: false, isHost });
            socketToRoom.set(socket.id, { roomId: roomIdStr, userId });

            socket.join(roomIdStr);

            console.log(`[join] ${userName}(${userId}) → room ${roomIdStr}`);
            io.to(roomIdStr).emit('update_player_list', players);
            broadcastRoomList();

            if (isHost) {
                io.emit('rooms_changed');
            }
        });

        socket.on('leave_room', ({ roomId, userId }) => {
            const roomIdStr = String(roomId);
            leaveRoom(socket, roomIdStr, userId);
        });

        socket.on('send_message', ({ roomId, userId, userName, message }) => {
            const roomIdStr = String(roomId);
            io.to(roomIdStr).emit('receive_message', {
                userId,
                userName,
                message,
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            });
        });

        socket.on('player_ready', ({ roomId, userId, isReady }) => {
            const roomIdStr = String(roomId);
            const players = rooms.get(roomIdStr);
            if (!players) return;

            const player = players.find(p => p.userId === userId);
            if (player) player.isReady = isReady;

            io.to(roomIdStr).emit('update_player_list', players);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            const info = socketToRoom.get(socket.id);
            if (!info) return;

            const timer = setTimeout(() => {
                reconnectTimers.delete(socket.id);
                leaveRoom(socket, info.roomId, info.userId);
            }, 10000);
            reconnectTimers.set(socket.id, timer);
            console.log(`[disconnect] ${info.userId} — 10초 후 퇴장 예정`);
        });

        socket.on('get_room_list', () => {
            broadcastRoomList();
        });

        socket.on('start_game', ({ roomId }) => {
            const roomIdStr = String(roomId);
            const players = rooms.get(roomIdStr);
            if (!players) return;

            const requester = players.find(p => p.socketId === socket.id);
            if (!requester?.isHost) return;

            const deck = shuffleDeck(generateDeck());

            const stands = {};
            players.forEach(p => {
                stands[p.userId] = deck.splice(0, 3);
            });
            stands['npc'] = deck.splice(0, 3);

            const questionDeck = shuffleDeck([...QUESTION_CARDS]);

            const gameState = {
                status: 'playing',
                stands,
                tileDeck: deck,
                tileDiscards: [],
                questionDeck,
                questionDiscards: [],
                scores: Object.fromEntries(players.map(p => [p.userId, 0])),
                currentTurnIndex: 0,
                playerOrder: players.map(p => p.userId),
            };
            gameStates.set(roomIdStr, gameState);

            // 첫 질문 미리 뽑기
            const firstQuestion = gameState.questionDeck.pop();
            gameState.questionDiscards.push(firstQuestion);
            const firstPlayers = gameState.playerOrder.map(uid => ({ userId: uid, hand: stands[uid] || [] }));
            firstPlayers.push({ userId: 'npc', hand: stands['npc'] || [] });
            const firstAnswer = evaluate(firstQuestion.seq, firstPlayers, 0);

            const firstTurnDeadline = Date.now() + TURN_TIMEOUT_MS;

            players.forEach(player => {
                const visibleStands = {};
                Object.entries(stands).forEach(([uid, tiles]) => {
                    if (uid !== player.userId) {
                        visibleStands[uid] = tiles;
                    }
                });

                io.to(player.socketId).emit('game_started', {
                    visibleStands,
                    scores: gameState.scores,
                    currentTurn: gameState.playerOrder[0],
                    playerOrder: players.map(p => ({ userId: p.userId, userName: p.userName })),
                    turnDeadline: firstTurnDeadline,
                    question: firstQuestion,
                    answer: firstAnswer,
                });
            });

            startTurnTimer(roomIdStr, io);
            console.log(`[game] Room ${roomIdStr} started`);
        });

        socket.on('next_turn', ({ roomId }) => {
            const roomIdStr = String(roomId);
            const gs = gameStates.get(roomIdStr);
            if (!gs || gs.status !== 'playing') return;

            const info = socketToRoom.get(socket.id);
            const currentPlayerId = gs.playerOrder[gs.currentTurnIndex];
            if (!info || info.userId !== currentPlayerId) return;

            clearTurnTimer(roomIdStr);

            gs.currentTurnIndex = (gs.currentTurnIndex + 1) % gs.playerOrder.length;

            if (gs.questionDeck.length === 0) {
                gs.questionDeck = shuffleDeck([...gs.questionDiscards]);
                gs.questionDiscards = [];
            }
            const question = gs.questionDeck.pop();
            gs.questionDiscards.push(question);

            const players = gs.playerOrder.map(uid => ({
                userId: uid,
                hand: gs.stands[uid] || [],
            }));
            players.push({ userId: 'npc', hand: gs.stands['npc'] || [] });

            const answer = evaluate(question.seq, players, gs.currentTurnIndex);
            const turnDeadline = Date.now() + TURN_TIMEOUT_MS;

            io.to(roomIdStr).emit('turn_changed', {
                currentTurn: gs.playerOrder[gs.currentTurnIndex],
                question,
                answer,
                turnDeadline,
            });

            startTurnTimer(roomIdStr, io);
            console.log(`[turn] Room ${roomIdStr} → ${gs.playerOrder[gs.currentTurnIndex]}, Q${question.seq}`);
        });

        socket.on('submit_answer', ({ roomId, values }) => {
            const roomIdStr = String(roomId);
            const gs = gameStates.get(roomIdStr);
            if (!gs || gs.status !== 'playing') return;

            const info = socketToRoom.get(socket.id);
            if (!info) return;

            const playerHand = gs.stands[info.userId];
            if (!playerHand) return;

            const correct = checkAnswer(values, playerHand);
            clearTurnTimer(roomIdStr);

            function dealNew(userId) {
                gs.tileDiscards.push(...gs.stands[userId]);
                if (gs.tileDeck.length < 3) {
                    gs.tileDeck = shuffleDeck([...gs.tileDiscards]);
                    gs.tileDiscards = [];
                }
                gs.stands[userId] = gs.tileDeck.splice(0, 3);
            }

            // 1) 정답이면 점수 먼저 반영
            if (correct) {
                gs.scores[info.userId] = (gs.scores[info.userId] || 0) + 1;
            }

            // 2) 정답/오답 오버레이 전송
            io.to(roomIdStr).emit('answer_result', {
                userId: info.userId,
                correct,
                scores: gs.scores,
            });

            // 2-1) 승리 조건 체크 (3점)
            if (correct && gs.scores[info.userId] >= 3) {
                gs.status = 'finished';
                clearTurnTimer(roomIdStr);
                const roomPlayers = rooms.get(roomIdStr);
                const winner = roomPlayers?.find(p => p.userId === info.userId);
                io.to(roomIdStr).emit('game_over', {
                    winnerId: info.userId,
                    winnerName: winner?.userName ?? info.userId,
                    scores: gs.scores,
                });
                console.log(`[game_over] Room ${roomIdStr} winner: ${info.userId}`);
                return;
            }

            // 3) 타일 교체
            if (correct) {
                // 정답: 모든 플레이어 + NPC 전부 교체
                gs.playerOrder.forEach(uid => dealNew(uid));
                dealNew('npc');
            } else {
                // 오답: 제출자 + NPC만 교체
                dealNew(info.userId);
                dealNew('npc');
            }

            // 4) 다음 턴으로 이동
            gs.currentTurnIndex = (gs.currentTurnIndex + 1) % gs.playerOrder.length;

            // 5) 새 질문 카드 뽑기
            if (gs.questionDeck.length === 0) {
                gs.questionDeck = shuffleDeck([...gs.questionDiscards]);
                gs.questionDiscards = [];
            }
            const question = gs.questionDeck.pop();
            gs.questionDiscards.push(question);

            // 6) 교체된 손패 기준으로 정답 계산
            const turnPlayers = gs.playerOrder.map(uid => ({
                userId: uid,
                hand: gs.stands[uid] || [],
            }));
            turnPlayers.push({ userId: 'npc', hand: gs.stands['npc'] || [] });
            const answer = evaluate(question.seq, turnPlayers, gs.currentTurnIndex);

            // 7) 새 타일 화면 반영
            const roomPlayers = rooms.get(roomIdStr);
            if (roomPlayers) {
                roomPlayers.forEach(player => {
                    const visibleStands = {};
                    Object.entries(gs.stands).forEach(([uid, tiles]) => {
                        if (uid !== player.userId) visibleStands[uid] = tiles;
                    });
                    io.to(player.socketId).emit('stands_updated', { visibleStands });
                });
            }

            // 8) 다음 턴 + 새 질문
            const turnDeadline = Date.now() + TURN_TIMEOUT_MS;
            io.to(roomIdStr).emit('turn_changed', {
                currentTurn: gs.playerOrder[gs.currentTurnIndex],
                question,
                answer,
                turnDeadline,
            });

            startTurnTimer(roomIdStr, io);
            console.log(`[answer] ${info.userId} → ${correct ? '정답' : '오답'} | next: ${gs.playerOrder[gs.currentTurnIndex]}, Q${question.seq}`);
        });

    }); // io.on('connection') 닫기

    function leaveRoom(socket, roomId, userId) {
        const players = rooms.get(roomId);
        if (!players) return;

        const idx = players.findIndex(p => p.userId === userId);
        if (idx === -1) return;

        const [removed] = players.splice(idx, 1);
        socketToRoom.delete(socket.id);
        socket.leave(roomId);

        console.log(`[leave] ${removed.userName}(${userId}) ← room ${roomId}`);

        if (players.length === 0) {
            rooms.delete(roomId);
            // DB에서도 방 삭제
            poolPromise.then(pool => {
                pool.request()
                    .input('roomId', sql.Int, parseInt(roomId))
                    .query('DELETE FROM Rooms WHERE room_seq = @roomId')
                    .catch(err => console.error('[DB] 방 삭제 실패:', err.message));
            });
            broadcastRoomList();
            io.emit('rooms_changed'); // 로비 유저들에게 방 삭제 알림
            return;
        }

        if (removed.isHost) {
            players[0].isHost = true;
        }

        io.to(roomId).emit('update_player_list', players);
        broadcastRoomList();
    }

    function broadcastRoomList() {
        const roomList = Array.from(rooms.entries()).map(([roomId, players]) => ({
            roomId,
            playerCount: players.length,
        }));
        io.emit('room_list_updated', roomList);
    }

    const PORT = 3000;
    httpServer.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
