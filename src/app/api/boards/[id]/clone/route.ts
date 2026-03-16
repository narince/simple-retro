import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { title } = body;

        // Note: PostgresService.cloneBoard must be implemented or we handle logic here.
        // Assuming serverDataService has cloneBoard or we use createBoard as a simple clone.

        const newBoard = await serverDataService.cloneBoard(params.id, title);
        return NextResponse.json(newBoard);

    } catch (error) {
        console.error("Clone Error", error);
        return NextResponse.json({ error: 'Clone Failed' }, { status: 500 });
    }
}
