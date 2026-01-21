
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { Column } from '@/services/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    if (!boardId) return NextResponse.json([]); // Return all? No, too big. Return empty if no filter.

    const cols = db.read().columns.filter(c => c.board_id === boardId).sort((a, b) => a.order_index - b.order_index);
    return NextResponse.json(cols);
}

export async function POST(request: Request) {
    const { boardId, title } = await request.json();
    const database = db.read();

    // Find max order
    const maxOrder = database.columns
        .filter(c => c.board_id === boardId)
        .reduce((max, c) => Math.max(max, c.order_index), -1);

    const newCol: Column = {
        id: crypto.randomUUID(),
        board_id: boardId,
        title,
        color: 'bg-slate-500',
        order_index: maxOrder + 1,
        created_at: new Date().toISOString()
    };

    database.columns.push(newCol);

    // Sync colors just in case? No, UI fetches columns separately usually.
    // But `board.column_colors` uses this.
    // Let's rely on client or a refresh to sync, or update board here.
    // Updating board:
    const board = database.boards.find(b => b.id === boardId);
    if (board) {
        const cols = database.columns.filter(c => c.board_id === boardId).sort((a, b) => a.order_index - b.order_index);
        board.column_colors = cols.map(c => c.color);
    }

    db.write(database);
    return NextResponse.json(newCol);
}
