
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const columnId = searchParams.get('columnId');
    if (!columnId) return NextResponse.json([]);

    const cards = await serverDataService.getCards(columnId);
    return NextResponse.json(cards);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { columnId, content, authorId, options } = body;

        const newCard = await serverDataService.createCard(columnId, content, authorId, options);
        return NextResponse.json(newCard);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
