
import fs from 'fs';
import path from 'path';
import { User, Board, Column, Card, Comment } from '@/services/types';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');
console.log('[ABSOLUTE_DB_PATH]:', DB_PATH);

export interface DatabaseSchema {
    users: User[];
    boards: Board[];
    columns: Column[];
    cards: Card[];
    reactions: ReactionEvent[]; // New field
}

export interface ReactionEvent {
    id: string;
    board_id: string;
    emoji: string;
    user_id: string;
    timestamp: number;
}

const DEFAULT_DB: DatabaseSchema = {
    users: [],
    boards: [],
    columns: [],
    cards: [],
    reactions: []
};

// Ensure DB exists
function ensureDbExists() {
    if (!fs.existsSync(DB_PATH)) {
        // Create directory if needed
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Write defaults
        const initialDB = { ...DEFAULT_DB };
        // Create Default Admin
        const adminUser: User = {
            id: 'admin-user-id',
            email: 'tolga.narince@ode.al',
            full_name: 'Tolga Narince',
            role: 'admin',
            last_login_at: new Date().toISOString()
        };
        initialDB.users.push(adminUser);

        fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    }
}

export const db = {
    read: (): DatabaseSchema => {
        ensureDbExists();
        try {
            const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
            const data = JSON.parse(fileContent);
            // console.log(`[DB] Read ${data.users.length} users`); // Too noisy?
            return data;
        } catch (error) {
            console.error('[DB] Failed to read DB:', error);
            // If read fails, maybe we should not return empty default, allows debugging
            return DEFAULT_DB;
        }
    },

    write: (data: DatabaseSchema) => {
        ensureDbExists(); // Safety
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    }
};
