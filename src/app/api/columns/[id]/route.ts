
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const updates = await request.json();
    const database = db.read();
    const col = database.columns.find(c => c.id === id);
    if (!col) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    Object.assign(col, updates);
    db.write(database);
    return NextResponse.json(col);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const database = db.read();
    database.columns = database.columns.filter(c => c.id !== id);
    // Delete cards in col? Yes
    database.cards = database.cards.filter(c => c.column_id !== id);
    db.write(database);
    return NextResponse.json({ success: true });
}
