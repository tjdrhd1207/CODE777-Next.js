const { createServer } = require("http");
const next = require("next");
const { parse } = require("url");
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// roomId -> [{ userId, userName, socketId, isReady, isHost }]
const rooms = new Map();
// socketId -> { roomId, userId }
const socketToRoom = new Map();

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
    });

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
            return;
        }

        // 방장이 나갔으면 다음 사람에게 방장 위임
        if (removed.isHost) {
            players[0].isHost = true;
        }

        io.to(roomId).emit('update_player_list', players);
    }

    const PORT = 3000;
    httpServer.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
