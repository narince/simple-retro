
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function DELETE(request: Request, props: { params: Promise<{ id: string; commentId: string }> }) {
    const params = await props.params;
    const { id, commentId } = params;

    await serverDataService.deleteComment(id, commentId);
    return NextResponse.json({ success: true });
}
