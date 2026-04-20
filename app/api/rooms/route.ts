import { poolPromise } from "@/app/lib/db";
import sql from 'mssql';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { title, maxPlayers, hostId } = await request.json();
        const pool = await poolPromise;

        const result = await pool.request()
            .input('title', sql.NVarChar, title)
            .input('maxPlayers', sql.Int, maxPlayers)
            .input('hostId', sql.Int, hostId)
            .query(`
        INSERT INTO Rooms (title, maxPlayers, hostId, status) 
        OUTPUT INSERTED.id 
        VALUES (@title, @maxPlayers, @hostId, 'waiting')
      `);

        const roomId = result.recordset[0].id;

        return NextResponse.json({ success: true, roomId });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}