
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { User } from '@/services/types';

export const dynamic = 'force-dynamic';

// GET: List all users
export async function GET() {
    const database = db.read();
    return NextResponse.json(database.users);
}

// POST: Create a user manually (Admin feature)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, full_name, role } = body;

        const normalizedEmail = email.trim().toLocaleLowerCase('tr-TR');
        const database = db.read();

        if (database.users.find(u => u.email.trim().toLocaleLowerCase('tr-TR') === normalizedEmail)) {
            return NextResponse.json({ error: 'AUTH_USER_EXISTS' }, { status: 409 });
        }

        const newUser: User = {
            id: crypto.randomUUID(),
            email: normalizedEmail,
            full_name: full_name || normalizedEmail.split('@')[0],
            role: role || 'user',
            // No password handling as per current flow, or unused
        };

        database.users.push(newUser);
        db.write(database);

        return NextResponse.json(newUser);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
