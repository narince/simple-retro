
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const board = db.read().boards.find(b => b.id === id);
    if (!board) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(board);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const updates = await request.json();
    const database = db.read();
    const index = database.boards.findIndex(b => b.id === id);

    if (index === -1) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    database.boards[index] = { ...database.boards[index], ...updates };
    db.write(database);

    return NextResponse.json(database.boards[index]);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const database = db.read();

    // Cascade Delete
    database.boards = database.boards.filter(b => b.id !== id);

    const colsToDelete = database.columns.filter(c => c.board_id === id).map(c => c.id);
    database.columns = database.columns.filter(c => c.board_id !== id);

    database.cards = database.cards.filter(c => !colsToDelete.includes(c.column_id));

    // Clean-up Reactions
    if (database.reactions) {
        database.reactions = database.reactions.filter(r => r.board_id !== id);
    }

    db.write(database);
    return NextResponse.json({ success: true });
}
