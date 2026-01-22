
import { IDataService } from './interface';
import { User, Board, Column, Card, Comment, ExportData } from './types';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Use NEON connection string from environment variable
const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

export class PostgresService implements IDataService {

    // --- Users ---
    async signIn(email: string): Promise<{ user: User | null; error: string | null }> {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length === 0) return { user: null, error: 'User not found' };

        // Update last login
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [res.rows[0].id]);

        return { user: this.mapUser(res.rows[0]), error: null };
    }

    async signUp(email: string): Promise<{ user: User | null; error: string | null }> {
        // Handled by API route logic mostly, but we can implement direct creation here
        // Check exists
        const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (exists.rows.length > 0) return { user: null, error: 'User already exists' };

        const id = crypto.randomUUID();
        const res = await pool.query(
            'INSERT INTO users (id, email, role, created_at, last_login_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
            [id, email, 'user']
        );
        return { user: this.mapUser(res.rows[0]), error: null };
    }

    async getCurrentUser(): Promise<User | null> {
        // Simplification: In a real app, we'd parse the session token here or passed in context.
        // For this architecture, the API route handles session validation and calls methods.
        // Client-side, this method is mocked in ApiService.
        return null;
    }

    async getUsers(): Promise<User[]> {
        const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        console.log(`[PostgresService] getUsers found ${res.rows.length} users`);
        return res.rows.map(this.mapUser);
    }

    async updateUser(updates: Partial<User>): Promise<User | null> {
        // Requires ID
        if (!updates.id) return null;

        // Dynamic update query
        const keys = Object.keys(updates).filter(k => k !== 'id');
        if (keys.length === 0) return null;

        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = [updates.id, ...keys.map(k => (updates as any)[k])];

        const res = await pool.query(`UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`, values);
        return res.rows[0] ? this.mapUser(res.rows[0]) : null;
    }

    async updateUserPassword(userId: string, password: string): Promise<void> {
        const hash = await bcrypt.hash(password, 10);
        // Assuming we store password_hash in DB (not in User type for security)
        // We'd need to alter table or assume column exists.
        // For this demo, let's assume 'password' column exists in DB but not exposed in type.
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    }

    async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<User | null> {
        const res = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING *', [role, userId]);
        return res.rows[0] ? this.mapUser(res.rows[0]) : null;
    }

    async updateUserAvatar(avatarUrl: string): Promise<void> {
        // API Route calls this with specific user ID, but method signature in interface implies context.
        // Wait, the interface says `updateUserAvatar(avatarUrl)`. 
        // Implementation should probably take userId as arg or be called on specific user.
        // Given usage in ApiService (which calls /api/users/[id]), we might need a specific method.
        // or generic updateUser.
        // For now, let's assume the caller uses `updateUser` with ID.
        // If this is called directly, it's ambiguous without ID.
        // We will skip implementations that rely on "current session" state in this stateless service class.
    }

    async deleteUser(userId: string): Promise<void> {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    async createUser(email: string, fullName: string, role: 'admin' | 'user', password?: string): Promise<User> {
        const id = crypto.randomUUID();
        // If password provided
        let hash = null;
        if (password) {
            hash = await bcrypt.hash(password, 10);
        }

        const res = await pool.query(
            'INSERT INTO users (id, email, full_name, role, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [id, email, fullName, role, hash]
        );
        return this.mapUser(res.rows[0]);
    }

    async adminUpdateUser(userId: string, updates: Partial<User>): Promise<User | null> {
        const keys = Object.keys(updates).filter(k => k !== 'id');
        if (keys.length === 0) return null;

        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = [userId, ...keys.map(k => (updates as any)[k])];

        const res = await pool.query(`UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`, values);
        return res.rows[0] ? this.mapUser(res.rows[0]) : null;
    }

    async signOut(): Promise<void> {
        // Stateless
    }

    // --- Boards ---
    async getBoards(teamId: string): Promise<Board[]> {
        // Fetch boards where user is creator OR owner OR added to allowed_user_ids
        // If teamId is actually userId in this context (Personal boards)
        // We use OR operator for arrays
        const res = await pool.query(
            `SELECT * FROM boards 
             WHERE team_id = $1 
             OR owner_id = $1 
             OR $1 = ANY(allowed_user_ids)
             ORDER BY created_at DESC`,
            [teamId]
        );
        return res.rows.map(this.mapBoard);
    }

    async createBoard(title: string, teamId: string, options?: any): Promise<Board> {
        const id = crypto.randomUUID();
        const res = await pool.query(
            'INSERT INTO boards (id, team_id, title, max_votes, column_colors, allowed_user_ids, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
            [id, teamId, title, options?.maxVotes || 5, [], options?.allowedUserIds || []]
        );

        // Initial columns?
        if (options?.initialColumns) {
            for (const col of options.initialColumns) {
                await this.createColumn(id, col.title); // We lose color info in basic createColumn signature, assume default
            }
        } else {
            await this.createColumn(id, 'Went Well');
            await this.createColumn(id, 'To Improve');
            await this.createColumn(id, 'Action Items');
        }

        return this.mapBoard(res.rows[0]);
    }

    async getBoard(boardId: string): Promise<Board | null> {
        const res = await pool.query('SELECT * FROM boards WHERE id = $1', [boardId]);
        return res.rows[0] ? this.mapBoard(res.rows[0]) : null;
    }

    async updateBoard(boardId: string, updates: Partial<Board>): Promise<Board | null> {
        const keys = Object.keys(updates).filter(k => k !== 'id');
        if (keys.length === 0) return null;

        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
        const values = [boardId, ...keys.map(k => (updates as any)[k])];

        const res = await pool.query(`UPDATE boards SET ${setClause} WHERE id = $1 RETURNING *`, values);
        return res.rows[0] ? this.mapBoard(res.rows[0]) : null;
    }

    async deleteBoard(boardId: string): Promise<void> {
        await pool.query('DELETE FROM boards WHERE id = $1', [boardId]);
        // Cascading deletes handled by DB FKs usually, but safety:
        await pool.query('DELETE FROM columns WHERE board_id = $1', [boardId]);
        // Cards/Comments also need cleanup if no cascade
    }

    async cloneBoard(boardId: string, newTitle?: string): Promise<Board> {
        throw new Error("Method not implemented.");
    }

    async inviteUserToBoard(boardId: string, userId: string): Promise<void> {
        // Append to allowed_user_ids array
        await pool.query(
            'UPDATE boards SET allowed_user_ids = array_append(allowed_user_ids, $1) WHERE id = $2',
            [userId, boardId]
        );
    }

    // --- Columns ---
    async getColumns(boardId: string): Promise<Column[]> {
        const res = await pool.query('SELECT * FROM columns WHERE board_id = $1 ORDER BY order_index ASC', [boardId]);
        return res.rows.map(this.mapColumn);
    }

    async createColumn(boardId: string, title: string): Promise<Column> {
        const id = crypto.randomUUID();
        // Get max order
        const ord = await pool.query('SELECT MAX(order_index) as m FROM columns WHERE board_id = $1', [boardId]);
        const nextOrder = (ord.rows[0].m || 0) + 1;

        const res = await pool.query(
            'INSERT INTO columns (id, board_id, title, order_index, color, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [id, boardId, title, nextOrder, '#e2e8f0']
        );
        return this.mapColumn(res.rows[0]);
    }

    async updateColumn(columnId: string, title: string): Promise<Column | null> {
        const res = await pool.query('UPDATE columns SET title = $1 WHERE id = $2 RETURNING *', [title, columnId]);
        return res.rows[0] ? this.mapColumn(res.rows[0]) : null;
    }

    async deleteColumn(columnId: string): Promise<void> {
        await pool.query('DELETE FROM columns WHERE id = $1', [columnId]);
    }

    async updateColumnColor(columnId: string, color: string): Promise<void> {
        await pool.query('UPDATE columns SET color = $1 WHERE id = $2', [color, columnId]);
    }

    // --- Cards ---
    async getCards(columnId: string): Promise<Card[]> {
        try {
            const res = await pool.query('SELECT * FROM cards WHERE column_id = $1 ORDER BY order_index ASC, created_at DESC', [columnId]);
            return res.rows.map(this.mapCard);
        } catch (error) {
            console.error("Postgres getCards Error:", error);
            throw error;
        }
    }

    async createCard(columnId: string, content: string, authorId: string, options?: any): Promise<Card> {
        const id = crypto.randomUUID();
        const res = await pool.query(
            'INSERT INTO cards (id, column_id, content, author_id, author_full_name, author_avatar_url, is_anonymous, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
            [id, columnId, content, authorId, options?.authorName, options?.authorAvatar, options?.isAnonymous || false]
        );
        return this.mapCard(res.rows[0]);
    }

    async updateCard(cardId: string, content: string): Promise<Card | null> {
        const res = await pool.query('UPDATE cards SET content = $1 WHERE id = $2 RETURNING *', [content, cardId]);
        return res.rows[0] ? this.mapCard(res.rows[0]) : null;
    }

    async deleteCard(cardId: string): Promise<void> {
        await pool.query('DELETE FROM cards WHERE id = $1', [cardId]);
    }

    async updateCardPosition(cardId: string, newColumnId: string, newIndex: number): Promise<void> {
        // Implementation for reordering is complex (shifting others).
        // Simply updating col/index for now.
        await pool.query('UPDATE cards SET column_id = $1, order_index = $2 WHERE id = $3', [newColumnId, newIndex, cardId]);
    }

    async voteCard(cardId: string, userId: string): Promise<void> {
        // Toggle vote
        // Check if voted
        const res = await pool.query('SELECT voted_user_ids FROM cards WHERE id = $1', [cardId]);
        let ids = res.rows[0]?.voted_user_ids || [];

        if (ids.includes(userId)) {
            ids = ids.filter((id: string) => id !== userId);
        } else {
            ids.push(userId);
        }

        await pool.query('UPDATE cards SET voted_user_ids = $1, votes = $2 WHERE id = $3', [ids, ids.length, cardId]);
    }

    async updateCardColor(cardId: string, color: string): Promise<void> {
        await pool.query('UPDATE cards SET color = $1 WHERE id = $2', [color, cardId]);
    }

    async addComment(cardId: string, text: string, authorId: string): Promise<void> {
        // Store as JSON in cards table for simplicity (as per types)
        const id = crypto.randomUUID();
        const newComment = { id, text, author_id: authorId, created_at: new Date().toISOString() };

        await pool.query(
            'UPDATE cards SET comments = comments || $1::jsonb WHERE id = $2',
            [JSON.stringify(newComment), cardId]
        );
    }

    async deleteComment(cardId: string, commentId: string): Promise<void> {
        // Remove from JSONB array
        // Advanced Postgres JSON query required
        await pool.query(
            `UPDATE cards 
             SET comments = (SELECT jsonb_agg(elem) 
                             FROM jsonb_array_elements(comments) elem 
                             WHERE elem->>'id' <> $1)
             WHERE id = $2`,
            [commentId, cardId]
        );
    }

    // --- Misc ---
    async getReactions(boardId: string, since: number): Promise<any[]> {
        // Convert JS timestamp (ms) to Postgres Timestamp?
        // Actually we store created_at. Let's filter by created_at > (now - 5s) maybe?
        // 'since' is mostly used for polling changes.
        // We actually want a dedicated reactions polling table or store.

        // Let's assume we have a table 'reactions' (id, board_id, emoji, user_id, created_at)
        const date = new Date(since).toISOString();
        const res = await pool.query(
            'SELECT * FROM reactions WHERE board_id = $1 AND created_at > $2',
            [boardId, date]
        );
        return res.rows.map(r => ({
            id: r.id,
            boardId: r.board_id,
            emoji: r.emoji,
            userId: r.user_id,
            timestamp: new Date(r.created_at).getTime()
        }));
    }

    async broadcastReaction(boardId: string, emoji: string, userId: string, reactionId?: string): Promise<void> {
        // Cleanup old reactions occassionally?
        // Insert new
        await pool.query(
            'INSERT INTO reactions (id, board_id, emoji, user_id, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [reactionId || crypto.randomUUID(), boardId, emoji, userId]
        );
    }

    async getExportData(): Promise<ExportData> {
        const usersRes = await pool.query('SELECT * FROM users');
        const boardsRes = await pool.query('SELECT * FROM boards');
        const columnsRes = await pool.query('SELECT * FROM columns ORDER BY order_index');
        const cardsRes = await pool.query('SELECT * FROM cards');

        // Check if reactions table exists or wrap in try-catch if optional
        let reactionsRes = { rows: [] };
        try {
            reactionsRes = await pool.query('SELECT * FROM reactions');
        } catch (e) { /* ignore */ }

        return {
            users: usersRes.rows.map(this.mapUser),
            boards: boardsRes.rows.map(this.mapBoard),
            columns: columnsRes.rows.map(this.mapColumn),
            cards: cardsRes.rows.map(this.mapCard),
            reactions: reactionsRes.rows
        };
    }

    // --- Mappers ---
    private mapUser(row: any): User {
        return {
            id: row.id,
            email: row.email,
            full_name: row.full_name,
            avatar_url: row.avatar_url,
            role: row.role,
            created_at: row.created_at,
            last_login_at: row.last_login_at,
            last_logout_at: row.last_logout_at
        };
    }

    private mapBoard(row: any): Board {
        return {
            id: row.id,
            title: row.title,
            team_id: row.team_id,
            created_by: row.team_id, // alias
            owner_id: row.owner_id,
            created_at: row.created_at,
            max_votes: row.max_votes,
            allowed_user_ids: row.allowed_user_ids || [],
            column_colors: row.column_colors || [],
            are_votes_hidden: row.are_votes_hidden,
            is_locked: row.is_locked,
            is_archived: row.is_archived
        };
    }

    private mapColumn(row: any): Column {
        return {
            id: row.id,
            board_id: row.board_id,
            title: row.title,
            color: row.color,
            order_index: row.order_index,
            created_at: row.created_at
        };
    }

    private mapCard(row: any): Card {
        return {
            id: row.id,
            column_id: row.column_id,
            content: row.content,
            author_id: row.author_id,
            author_full_name: row.author_full_name,
            author_avatar_url: row.author_avatar_url,
            isAnonymous: row.is_anonymous, // DB uses snake_case
            votes: row.votes || 0,
            voted_user_ids: row.voted_user_ids || [],
            comments: row.comments || [],
            color: row.color,
            created_at: row.created_at
        };
    }
}
