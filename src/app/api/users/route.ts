
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';
// GET: List all users
export async function GET() {
    const users = await serverDataService.getUsers();
    return NextResponse.json(users);
}

// POST: Create a user manually (Admin feature)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, full_name, role } = body;

        // Basic validation
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user exists (PostgresService might handle this or we check first)
        // Ideally service handles it, but for now we trust createUser to just work or throw unique constraint error
        // Let's check uniqueness first to be safe if service doesn't return error object
        const users = await serverDataService.getUsers();
        // Optimization: Add specific getUserByEmail to interface later. 
        // For now, getting all users is okay for small scale admin usage.
        if (users.find(u => u.email === email)) {
            return NextResponse.json({ error: 'AUTH_USER_EXISTS' }, { status: 409 });
        }

        const newUser = await serverDataService.createUser(email, full_name, role);
        return NextResponse.json(newUser);

    } catch (error) {
        console.error("Create User Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
