
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';
// GET: List all users
export async function GET() {
    const users = await serverDataService.getUsers();
    return NextResponse.json(users);
}

// POST: Create a user manually (Admin feature)
export async function POST(request: Request) {
    return NextResponse.json({ error: 'Not Implemented in Postgres version' }, { status: 501 });
}
