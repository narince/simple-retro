
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (userId) {
            // Update the user's last_logout_at timestamp
            // Using ISO string ensures compatibility with the User type (string)
            await serverDataService.updateUser({
                id: userId,
                last_logout_at: new Date().toISOString()
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
}
