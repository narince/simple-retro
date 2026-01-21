
import { NextResponse } from 'next/server';
import { db, ReactionEvent } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const since = searchParams.get('since'); // Timestamp

    if (!boardId) return NextResponse.json([]);

    const database = db.read();

    // Cleanup old reactions (>10 sec) to keep DB small - optional optimization
    // const now = Date.now();
    // database.reactions = database.reactions.filter(r => now - r.timestamp < 10000);
    // db.write(database); // Write back cleanup? Maybe too aggressive on reading.
    // Let's just filter for response.

    const sinceTs = since ? parseInt(since) : 0;

    // Return reactions for this board after 'since'
    const newReactions = (database.reactions || []).filter(r =>
        r.board_id === boardId && r.timestamp > sinceTs
    );

    return NextResponse.json(newReactions);
}

export async function POST(request: Request) {
    const { boardId, emoji, userId } = await request.json();
    const database = db.read();

    const newReaction: ReactionEvent = {
        id: Math.random().toString(36).substring(7),
        board_id: boardId,
        emoji,
        user_id: userId,
        timestamp: Date.now()
    };

    if (!database.reactions) database.reactions = [];
    database.reactions.push(newReaction);

    // KEEP ONLY LAST 50 Reactions globally to prevent file bloat
    if (database.reactions.length > 50) {
        database.reactions = database.reactions.slice(-50);
    }

    db.write(database);
    return NextResponse.json({ success: true, timestamp: newReaction.timestamp });
}
