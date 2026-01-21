
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { sanitize } from '@/lib/security';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const updates = await request.json();
    if (updates.content) updates.content = sanitize(updates.content);

    const database = db.read();
    const index = database.cards.findIndex(c => c.id === id);
    if (index === -1) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    database.cards[index] = { ...database.cards[index], ...updates };
    db.write(database); // Optimization: only write if changed
    return NextResponse.json(database.cards[index]);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const database = db.read();
    database.cards = database.cards.filter(c => c.id !== id);
    db.write(database);
    return NextResponse.json({ success: true });
}
