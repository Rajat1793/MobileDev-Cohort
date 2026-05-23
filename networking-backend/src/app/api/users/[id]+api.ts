import { db } from '@/lib/db';

type Ctx = {
    params: {
        id: string;
    }
}
export async function GET(request: Request, {params}: Ctx) {
    try  {
        const result = await db.execute({
            sql: 'SELECT * FROM user_data WHERE id = ?',
            args: [params.id]
        });
        return Response.json(result.rows);
    }
    catch (error) {
        return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request, {params}: Ctx) {
    
}

export async function PUT(request: Request, {params}: Ctx) {

}

export async function DELETE(request: Request, {params}: Ctx) {

}
