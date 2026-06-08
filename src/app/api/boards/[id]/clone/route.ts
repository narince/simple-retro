import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { newTitle, title, clonerId } = body;
        const titleToUse = newTitle || title;

        const newBoard = await serverDataService.cloneBoard(params.id, titleToUse, clonerId);
        return NextResponse.json(newBoard);

    } catch (error) {
        console.error("Clone Error", error);
        return NextResponse.json({ error: 'Clone Failed' }, { status: 500 });
    }
}
