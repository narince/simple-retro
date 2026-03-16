
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const board = await serverDataService.getBoard(params.id);
    if (!board) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json(board);
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const updates = await request.json();
        const { id } = params;

        // Handle invitation special case manually if needed, or assume service handles simple updates
        // Specifically for inviteUserToBoard which updates allowed_user_ids
        if (updates.action === 'invite' && updates.userId) {
            await serverDataService.inviteUserToBoard(id, updates.userId);
            const updated = await serverDataService.getBoard(id);
            return NextResponse.json(updated);
        }

        // Remove ID from updates if present to prevent updating the primary key or mismatch
        if ('id' in updates) delete updates.id;

        const updated = await serverDataService.updateBoard(id, updates);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update Board Error:", error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    await serverDataService.deleteBoard(params.id);
    return NextResponse.json({ success: true });
}
