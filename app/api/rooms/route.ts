import { poolPromise } from "@/app/lib/db";
import sql from 'mssql';
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
               SELECT
                    r.room_seq,
                    r.name,
                    r.capacity,
                    r.turnTime,
                    r.status,
                    r.hostId,
                    r.createdAt
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
        const { name, capacity, turnTime = 30, hostId } = await request.json();
        const pool = await poolPromise;

        const roomResult = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('capacity', sql.Int, capacity)
            .input('turnTime', sql.Int, turnTime)
            .input('hostId', sql.VarChar, hostId)
            .query(`
                INSERT INTO Rooms (name, capacity, turnTime, hostId, status)
                OUTPUT INSERTED.room_seq
                VALUES (@name, @capacity, @turnTime, @hostId, 'waiting')
            `);

        const roomSeq = roomResult.recordset[0].room_seq;

        return NextResponse.json({ success: true, roomSeq });
    } catch (err: any) {
        console.error("방 생성 DB 에러:", err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
