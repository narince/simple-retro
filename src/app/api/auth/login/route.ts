
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

        const user = database.users.find(u => u.email.trim().toLocaleLowerCase('tr-TR') === normalizedEmail);

        if (!user) {
            return NextResponse.json({ error: 'AUTH_USER_NOT_FOUND' }, { status: 404 });
        }

        // Update login time
        user.last_login_at = new Date().toISOString();
        db.write(database);

        return NextResponse.json(user);

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
