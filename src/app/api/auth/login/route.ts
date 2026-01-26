
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        const result = await serverDataService.signIn(email);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        return NextResponse.json(result.user);

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
