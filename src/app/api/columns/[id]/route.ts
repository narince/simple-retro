
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();

        if (body.color) {
            await serverDataService.updateColumnColor(params.id, body.color);
            return NextResponse.json({ success: true });
        }

        const updated = await serverDataService.updateColumn(params.id, body.title);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    await serverDataService.deleteColumn(params.id);
    return NextResponse.json({ success: true });
}
