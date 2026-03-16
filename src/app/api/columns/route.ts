
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    if (!boardId) return NextResponse.json([]);

    const columns = await serverDataService.getColumns(boardId);
    return NextResponse.json(columns);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { boardId, title } = body;
        const newCol = await serverDataService.createColumn(boardId, title);
        return NextResponse.json(newCol);
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
