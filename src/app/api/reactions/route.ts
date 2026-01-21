import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const since = searchParams.get('since'); // Timestamp

    if (!boardId) return NextResponse.json([]);

    const sinceTs = since ? parseInt(since) : 0;
    const reactions = await serverDataService.getReactions(boardId, sinceTs);

    return NextResponse.json(reactions);
}

export async function POST(request: Request) {
    const { boardId, emoji, userId } = await request.json();

    await serverDataService.broadcastReaction(boardId, emoji, userId);
    return NextResponse.json({ success: true, timestamp: Date.now() });
}
