
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { Comment } from '@/services/types';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, commentId: string }> }) {
    const { id, commentId } = await params;
    const database = db.read();
    const card = database.cards.find(c => c.id === id);

    if (card && card.comments) {
        // Filter out
        card.comments = (card.comments as Comment[]).filter(c => c.id !== commentId);
        db.write(database);
    }
    return NextResponse.json({ success: true });
}
