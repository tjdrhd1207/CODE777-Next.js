const { createServer } = require("http");
const next = require("next");
const { parse } = require("url");
const { Server } = require('socket.io');
const { generateDeck, shuffleDeck, QUESTION_CARDS } = require('./lib/cards');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// roomId -> [{ userId, userName, socketId, isReady, isHost }]
const rooms = new Map();
// socketId -> { roomId, userId }
const socketToRoom = new Map();
// roomId -> 게임 상태
const gameStates = new Map();

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
            broadcastRoomList(); // 방 인원 변경 → 로비에 있는 모든 클라이언트에게 push
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
            if (info) {
                leaveRoom(socket, info.roomId, info.userId);
            }
        });

        // 클라이언트가 로비에 처음 접속할 때 현재 인원수를 요청하는 용도
        socket.on('get_room_list', () => {
            broadcastRoomList();
        });

        socket.on('start_game', ({ roomId }) => {
            const roomIdStr = String(roomId);
            const players = rooms.get(roomIdStr);
            if (!players) return;

            // 방장만 시작 가능 (콘솔에서 직접 emit하는 경우 방어)
            const requester = players.find(p => p.socketId === socket.id);
            if (!requester?.isHost) return;

            // 타일 덱 생성 및 셔플
            const deck = shuffleDeck(generateDeck());

            // 각 플레이어 + NPC 받침대에 3장씩 배분
            const stands = {};
            players.forEach(p => {
                stands[p.userId] = deck.splice(0, 3);
            });
            stands['npc'] = deck.splice(0, 3);

            // 질문 카드 셔플
            const questionDeck = shuffleDeck([...QUESTION_CARDS]);

            // 게임 상태 저장
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

            // 각 플레이어에게 다른 payload 전송 (자기 타일은 제외)
            players.forEach(player => {
                const visibleStands = {};
                Object.entries(stands).forEach(([uid, tiles]) => {
                    if (uid !== player.userId) {
                        visibleStands[uid] = tiles;
                    }
                });

                io.to(player.socketId).emit('game_started', {
                    visibleStands,  // 상대방 + NPC 받침대
                    scores: gameState.scores,
                    currentTurn: gameState.playerOrder[0],
                    playerOrder: players.map(p => ({ userId: p.userId, userName: p.userName })),
                });
            });

            console.log(`[game] Room ${roomIdStr} started`);
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
            broadcastRoomList(); // 방이 비어서 삭제됐을 때도 갱신
            return;
        }

        // 방장이 나갔으면 다음 사람에게 방장 위임
        if (removed.isHost) {
            players[0].isHost = true;
        }

        io.to(roomId).emit('update_player_list', players);
        broadcastRoomList(); // 방 인원 변경 → 로비에 있는 모든 클라이언트에게 push
    }

    // 현재 rooms Map의 인원수를 모든 클라이언트에게 broadcast
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
