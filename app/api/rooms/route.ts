import { poolPromise } from "@/app/lib/db";
import sql from 'mssql';
import { NextResponse } from "next/server";


// 방 목록 화면이 열릴 때 호출
export async function GET() {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
               SELECT 
                    r.id, 
                    r.title, 
                    r.maxPlayers, 
                    r.status, 
                    (SELECT COUNT(*) FROM RoomPlayers rp WHERE rp.roomId = r.id) AS players
                FROM Rooms r
                WHERE r.status = 'waiting'
                ORDER BY r.createdAt DESC
            `);

        return NextResponse.json({ success: true, rooms: result.recordset });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { title, maxPlayers, hostId } = await request.json();
        const pool = await poolPromise;

        // 1. 트랜잭션 시작
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {

            // 2. Rooms 테이블에 방 생성
            const roomResult = await transaction.request()
                .input('title', sql.NVarChar, title)
                .input('maxPlayers', sql.Int, maxPlayers)
                .input('hostId', sql.Int, hostId)
                .query(`
                    INSERT INTO Rooms (title, maxPlayers, hostId, status) 
                    OUTPUT INSERTED.id 
                    VALUES (@title, @maxPlayers, @hostId, 'waiting')
                `);

            const roomId = roomResult.recordset[0].id;

            // 3. RoomPlayers 테이블에 방장 추가
            // 대기실에서는 일단 playerOrder를 1로 주거나 null로 둔 뒤 게임 시작 시 확정합니다.
            await transaction.request()
                .input('roomId', sql.Int, roomId)
                .input('userId', sql.Int, hostId)
                .query(`
                INSERT INTO RoomPlayers (roomId, userId, playerOrder, isReady)
                VALUES (@roomId, @userId, 1, 1) -- 방장은 기본적으로 준비 완료(isReady=1) 상태
            `);

            // 4. 모든 작업 시 commit
            await transaction.commit();

            return NextResponse.json({ success: true, roomId });
        } catch (err) {
            // 오류 발생 시 Rollback
            await transaction.rollback();
            throw err;
        }

    } catch (err: any) {
        console.error("방 생성 DB 에러:", err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}