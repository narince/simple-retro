
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { Board } from '@/services/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(db.read().boards);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, teamId, options, creatorId } = body;

        // Options: initialColumns, maxVotes
        const defaultCols = options?.initialColumns?.map((c: any, i: number) => ({ ...c, order: i })) || [
            { title: 'Start', color: 'bg-teal-600', order: 0 },
            { title: 'Stop', color: 'bg-rose-600', order: 1 },
            { title: 'Continue', color: 'bg-violet-600', order: 2 },
        ];

        const database = db.read();

        const newBoard: Board = {
            id: crypto.randomUUID(),
            team_id: teamId || 'default-team',
            title,
            created_by: creatorId || 'api-user',
            is_locked: false,
            are_votes_hidden: false,
            is_voting_disabled: false,
            are_cards_hidden: false,
            max_votes: options?.maxVotes,
            is_archived: false,
            column_colors: defaultCols.map((c: any) => c.color),
            created_at: new Date().toISOString(),
            allowed_user_ids: creatorId ? [creatorId] : []
        };
        database.boards.push(newBoard);

        // Create Default Cols
        defaultCols.forEach((c: any) => {
            database.columns.push({
                id: crypto.randomUUID(),
                board_id: newBoard.id,
                title: c.title,
                color: c.color,
                order_index: c.order,
                created_at: new Date().toISOString()
            });
        });

        db.write(database); // Save all
        return NextResponse.json(newBoard);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
