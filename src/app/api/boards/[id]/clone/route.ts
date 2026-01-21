import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { Board, Column, Card } from '@/services/types';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { newTitle } = await request.json();

    const database = db.read();
    const originalBoard = database.boards.find(b => b.id === id);

    if (!originalBoard) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    const newBoardId = Math.random().toString(36).substring(7);
    const newBoard: Board = {
        ...originalBoard,
        id: newBoardId,
        title: newTitle || `${originalBoard.title} (Clone)`,
        created_at: new Date().toISOString(),
        is_archived: false,
        // Reset specific fields if needed
    };

    // Clone Columns
    const orgCols = database.columns.filter(c => c.board_id === id);
    const colMap: Record<string, string> = {}; // OldID -> NewID

    const newCols: Column[] = orgCols.map(col => {
        const newColId = Math.random().toString(36).substring(7);
        colMap[col.id] = newColId;
        return {
            ...col,
            id: newColId,
            board_id: newBoardId,
            created_at: new Date().toISOString()
        };
    });

    // Clone Cards
    const orgCards = database.cards.filter(c => orgCols.some(col => col.id === c.column_id));
    const newCards: Card[] = orgCards.map(card => {
        return {
            ...card,
            id: Math.random().toString(36).substring(7),
            column_id: colMap[card.column_id], // Map to new column
            created_at: new Date().toISOString(),
            votes: 0, // Reset votes? Usually yes for retro.
            voted_user_ids: [],
            comments: [] // Reset comments? Usually yes.
        };
    });

    database.boards.push(newBoard);
    database.columns.push(...newCols);
    database.cards.push(...newCards);

    db.write(database);

    return NextResponse.json(newBoard);
}
