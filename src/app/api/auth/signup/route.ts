import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        const result = await serverDataService.signUp(email);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 409 });
        }

        return NextResponse.json(result.user);

    } catch (error) {
        console.error("Signup Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
