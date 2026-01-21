
import { NextResponse } from 'next/server';
// Fixed duplicate import
import { serverDataService } from '@/services/server';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { text, authorId } = body;

        await serverDataService.addComment(params.id, text, authorId);
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
