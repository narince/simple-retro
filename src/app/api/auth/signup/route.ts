
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { User } from '@/services/types';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLocaleLowerCase('tr-TR');
        const database = db.read();

        // Check exists
        if (database.users.find(u => u.email.trim().toLocaleLowerCase('tr-TR') === normalizedEmail)) {
            return NextResponse.json({ error: 'AUTH_USER_EXISTS' }, { status: 409 }); // 409 Conflict
        }

        const isFirstUser = database.users.length === 0;

        const newUser: User = {
            id: crypto.randomUUID(),
            email: normalizedEmail,
            full_name: normalizedEmail.split('@')[0],
            role: isFirstUser ? 'admin' : 'user',
            last_login_at: new Date().toISOString()
        };

        database.users.push(newUser);
        db.write(database);

        return NextResponse.json(newUser);

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
