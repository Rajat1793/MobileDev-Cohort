import { db } from '@/lib/db';

export async function GET(request: Request) {
    try  {
        const result = await db.execute({
            sql: 'SELECT * FROM user_data'
        });
        return Response.json(result.rows);
    }
    catch (error) {
        return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
export async function POST(request: Request) {
    const {name, email} = await request.json();
    if (!name || !email) {
        return Response.json( 'Name and email are required', {status: 400});
    }
    try {
        const result = await db.execute({
            sql: 'INSERT INTO user_data (name, email) VALUES (?, ?)',
            args: [name, email]
        });
        return Response.json(
            { id: Number(result.lastInsertRowid), name, email },
            {status: 201}
        );
    }
    catch (error) {
        return Response.json({ error: 'Failed to create user' }, { status: 500 });
    }
}   