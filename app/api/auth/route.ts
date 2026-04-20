import { poolPromise } from "@/app/lib/db";
import sql from 'mssql';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        const pool = await poolPromise;

        // 1. 기존 유저 확인
        const userResult = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');

        if (userResult.recordset.length > 0) {
            // 2. 로그인 로직 (비밀번호 체크)
            const user = userResult.recordset[0];
            if (user.password === password) {
                return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
            } else {
                return NextResponse.json({ success: false, message: '비밀번호가 틀립니다.' }, { status: 401 });
            }
        } else {
            // 3. 회원가입 로직
            const insertResult = await pool.request()
                .input('username', sql.VarChar, username)
                .input('password', sql.VarChar, password)
                .query('INSERT INTO Users (username, password) OUTPUT INSERTED.id VALUES (@username, @password)');

            return NextResponse.json({
                success: true,
                user: { id: insertResult.recordset[0].id, username },
                message: '회원가입 완료'
            });

        }
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}