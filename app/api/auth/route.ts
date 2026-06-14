import { poolPromise } from "@/app/lib/db";
import sql from 'mssql';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { username, password, action = 'login' } = await request.json();
        const pool = await poolPromise;

        const userResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM users WHERE id = @username');

        const userExists = userResult.recordset.length > 0;

        if (action === 'signup') {
            if (userExists) {
                return NextResponse.json({ success: false, message: '이미 사용 중인 아이디입니다.' }, { status: 409 });
            }
            const insertResult = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('password', sql.NVarChar, password)
                .query('INSERT INTO users (id, password) OUTPUT INSERTED.id VALUES (@username, @password)');

            return NextResponse.json({
                success: true,
                user: { id: insertResult.recordset[0].id },
                message: '회원가입 완료'
            });
        }

        // action === 'login'
        if (!userExists) {
            return NextResponse.json({ success: false, message: '존재하지 않는 아이디입니다.' }, { status: 401 });
        }
        const user = userResult.recordset[0];
        if (user.password !== password) {
            return NextResponse.json({ success: false, message: '비밀번호가 틀립니다.' }, { status: 401 });
        }
        return NextResponse.json({ success: true, user: { id: user.id } });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}