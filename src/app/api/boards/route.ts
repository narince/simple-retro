
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || 'default-team';
    const boards = await serverDataService.getBoards(teamId);
    return NextResponse.json(boards);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, teamId, options, creatorId } = body;

        // Note: creatorId should practically come from session/context in real auth, 
        // but we pass it for now or service handles it. 
        // Our PostgresService.createBoard currently ignores creatorId in the signature 
        // but handles defaults internally. 
        // We'll trust the service logic for now.

        const newBoard = await serverDataService.createBoard(title, teamId || 'default-team', options);
        return NextResponse.json(newBoard);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
