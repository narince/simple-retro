
import { NextResponse } from 'next/server';
import { serverDataService } from '@/services/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Security check usually done via middleware or session check here
        // For MVP assuming admin access controls on page level + strict API usage

        const data = await serverDataService.getExportData();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Export failed:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
