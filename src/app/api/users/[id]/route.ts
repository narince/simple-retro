
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

// PATCH: Update User (Role, Password, Avatar)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const database = db.read();
        const index = database.users.findIndex(u => u.id === id);

        console.log(`[API] PATCH User ${id}. Found index: ${index}. Total users: ${database.users.length}`);

        if (index === -1) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Merge updates
        const updatedUser = { ...database.users[index], ...body };

        // Sanitize sensitive fields if needed? No, internal API.

        database.users[index] = updatedUser;
        db.write(database);

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove User
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const database = db.read();

    // Check if user exists
    const exists = database.users.some(u => u.id === id);
    if (!exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    database.users = database.users.filter(u => u.id !== id);
    db.write(database);

    return NextResponse.json({ success: true });
}
