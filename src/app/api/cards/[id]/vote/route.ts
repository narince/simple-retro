import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { userId } = await request.json();
    const database = db.read();
    const card = database.cards.find(c => c.id === id);

    if (!card) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    if (!card.voted_user_ids) card.voted_user_ids = [];

    // Toggle logic
    if (card.voted_user_ids.includes(userId)) {
        card.voted_user_ids = card.voted_user_ids.filter(v_id => v_id !== userId);
        card.votes = Math.max(0, card.votes - 1);
    } else {
        card.voted_user_ids.push(userId);
        card.votes += 1;
    }

    db.write(database);
    return NextResponse.json({ success: true, votes: card.votes });
}
