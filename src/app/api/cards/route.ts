
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { Card } from '@/services/types';
import { sanitize } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const columnId = searchParams.get('columnId');
    if (!columnId) return NextResponse.json([]);

    const cards = db.read().cards.filter(c => c.column_id === columnId);
    return NextResponse.json(cards);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { columnId, content, authorId, options } = body;

    const database = db.read();

    const newCard: Card = {
        id: crypto.randomUUID(),
        column_id: columnId,
        content: sanitize(content), // Sanitize is technically client-side lib but imported in server ok? Check later.
        author_id: authorId,
        votes: 0,
        comments: [],
        voted_user_ids: [],
        is_anonymous: options?.isAnonymous,
        author_name: options?.authorName,
        author_avatar: options?.authorAvatar,
        created_at: new Date().toISOString()
    };

    database.cards.push(newCard);
    db.write(database);
    return NextResponse.json(newCard);
}
