
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const board = await serverDataService.getBoard(params.id);
    if (!board) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(board);
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const updates = await request.json();
        // Remove ID from updates if present
        delete updates.id;

        // Handle invitation special case manually if needed, or assume service handles simple updates
        // Specifically for inviteUserToBoard which updates allowed_user_ids
        if (updates.action === 'invite' && updates.userId) {
            await serverDataService.inviteUserToBoard(params.id, updates.userId);
            const updated = await serverDataService.getBoard(params.id);
            return NextResponse.json(updated);
        }

        const updated = await serverDataService.updateBoard(params.id, updates);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    await serverDataService.deleteBoard(params.id);
    return NextResponse.json({ success: true });
}
