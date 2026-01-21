
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();

        if (body.color) {
            await serverDataService.updateCardColor(params.id, body.color);
            return NextResponse.json({ success: true });
        }

        if (body.columnId) {
            // Move
            await serverDataService.updateCardPosition(params.id, body.columnId, body.newIndex || 0);
            return NextResponse.json({ success: true });
        }

        const updated = await serverDataService.updateCard(params.id, body.content);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    await serverDataService.deleteCard(params.id);
    return NextResponse.json({ success: true });
}
