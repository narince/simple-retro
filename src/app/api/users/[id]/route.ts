import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    await serverDataService.deleteUser(params.id);
    return NextResponse.json({ success: true });
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const body = await request.json();

        if (body.role) {
            await serverDataService.updateUserRole(params.id, body.role);
            return NextResponse.json({ success: true });
        }

        // Generic admin update
        await serverDataService.adminUpdateUser(params.id, body);
        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
