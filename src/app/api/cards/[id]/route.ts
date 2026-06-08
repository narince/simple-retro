
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();

        if (body.color) {
            await serverDataService.updateCardColor(params.id, body.color);
            return NextResponse.json({ success: true });
        }

        const columnId = body.columnId || body.column_id;
        if (columnId) {
            // Move
            await serverDataService.updateCardPosition(params.id, columnId, body.newIndex || body.new_index || 0);
            return NextResponse.json({ success: true });
        }

        const updated = await serverDataService.updateCard(params.id, body.content);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    return PATCH(request, props);
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    await serverDataService.deleteCard(params.id);
    return NextResponse.json({ success: true });
}
