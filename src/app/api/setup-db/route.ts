import { NextResponse } from 'next/server';
import { pool } from '@/lib/neon';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const schemaPath = path.join(process.cwd(), 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

        // Split by semicolon to execute one by one? 
        // Neon handles multi-statement usually, but safer to split if we encounter issues.
        // For now try single block execution.

        await pool.query(schemaSql);

        return NextResponse.json({ message: "Database initialized successfully" });
    } catch (error) {
        console.error("Setup DB Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
