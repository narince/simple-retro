
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { Comment } from '@/services/types';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { text, authorId } = await request.json();
    const database = db.read();
    const card = database.cards.find(c => c.id === id);

    if (!card) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    if (!card.comments || (card.comments.length > 0 && typeof card.comments[0] === 'string')) {
        card.comments = [];
    }

    const newComment: Comment = {
        id: crypto.randomUUID(),
        text,
        author_id: authorId,
        created_at: new Date().toISOString()
    };

    // Type assertion tricky here due to legacy check, assuming cleaner type now
    (card.comments as Comment[]).push(newComment);
    db.write(database);
    return NextResponse.json(newComment);
}
