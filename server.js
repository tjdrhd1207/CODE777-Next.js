const { createServer } = require("http");
const { default: next } = require("next");
const { parse } = require("url");
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        cors: { origin: "*" } // 로컬 개발 시 허용
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // 사용자가 작성하신 소켓 로직을 여기에 넣습니다.
        socket.on('join_room', async ({ roomId, userId, userName }) => {
            // ... DB 처리 및 emit 로직 ...
        });

        socket.on('player_ready', async (data) => {
            // ... 준비 상태 업데이트 로직 ...
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    const PORT = 3000;
    httpServer.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    })
});