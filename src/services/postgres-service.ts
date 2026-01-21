import { IDataService } from './interface';
import { User, Board, Column, Card, Comment } from './types';
import { pool } from '@/lib/neon';

export class PostgresService implements IDataService {

    // --- Auth ---
    async signIn(email: string): Promise<{ user: User | null; error: string | null }> {
        const normalizedEmail = email.trim();
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        const user = res.rows[0];

        if (!user) return { user: null, error: 'AUTH_USER_NOT_FOUND' };

        // Update last login
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        return { user: this.mapUser(user), error: null };
    }

    async signUp(email: string): Promise<{ user: User | null; error: string | null }> {
        const normalizedEmail = email.trim();

        // Check exist
        const check = await pool.query('SELECT 1 FROM users WHERE email = $1', [normalizedEmail]);
        if (check.rows.length > 0) return { user: null, error: 'AUTH_USER_EXISTS' };

        const id = crypto.randomUUID();
        const role = (await this.getUserCount()) === 0 ? 'admin' : 'user';

        await pool.query(
            'INSERT INTO users (id, email, full_name, role, last_login_at) VALUES ($1, $2, $3, $4, NOW())',
            [id, normalizedEmail, normalizedEmail.split('@')[0], role]
        );

        const newUser = await this.getUser(id);
        return { user: newUser, error: null };
    }

    async getCurrentUser(): Promise<User | null> {
        // In a real server-side implementations, this would parse a session token
        // But since this service runs on the server (API routes), the caller usually provides the context.
        // However, for strict compatibility with the interface used by Client Components via Context,
        // we might not use this method directly on the server.
        // This method is generally for client-side usage.
        return null;
    }

    async createUser(email: string, fullName: string, role: 'admin' | 'user', password?: string): Promise<User> {
        const id = crypto.randomUUID();
        await pool.query(
            'INSERT INTO users (id, email, full_name, role) VALUES ($1, $2, $3, $4)',
            [id, email, fullName, role]
        );
        return (await this.getUser(id))!;
    }

    async updateUser(updates: Partial<User>): Promise<User | null> {
        // This requires knowing WHICH user to update. Usually ID is passed.
        // If updates has ID, use it.
        if (!updates.id) return null;

        const setString = Object.keys(updates)
            .filter(k => k !== 'id')
            .map((k, i) => `${k} = $${i + 2}`)
            .join(', ');

        const values = Object.keys(updates)
            .filter(k => k !== 'id')
            .map(k => (updates as any)[k]);

        if (values.length === 0) return this.getUser(updates.id);

        await pool.query(`UPDATE users SET ${setString} WHERE id = $1`, [updates.id, ...values]);
        return this.getUser(updates.id);
    }

    async updateUserAvatar(avatarUrl: string): Promise<void> {
        // Need current user context here, problematic in this interface design for direct server calls without ID 
        // Assuming this is called with an ID in a real app, but for now skipping as strictly client-side flow handles this via API
    }

    // --- Users ---
    async getUsers(): Promise<User[]> {
        const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        return res.rows.map(this.mapUser);
    }

    async getUser(id: string): Promise<User | null> {
        const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return res.rows[0] ? this.mapUser(res.rows[0]) : null;
    }

    async deleteUser(userId: string): Promise<void> {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }

    async updateUserPassword(userId: string, password: string): Promise<void> {
        // Password logic would go here
    }

    async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    }

    async adminUpdateUser(userId: string, updates: Partial<User>): Promise<void> {
        await this.updateUser({ ...updates, id: userId });
    }

    async inviteUserToBoard(boardId: string, userId: string): Promise<void> {
        const res = await pool.query('SELECT allowed_user_ids FROM boards WHERE id = $1', [boardId]);
        const current = res.rows[0]?.allowed_user_ids || [];
        if (!current.includes(userId)) {
            await pool.query('UPDATE boards SET allowed_user_ids = array_append(allowed_user_ids, $1) WHERE id = $2', [userId, boardId]);
        }
    }


    async signOut(): Promise<void> {
        // Client side concept
    }

    // --- Boards ---
    async getBoards(teamId: string): Promise<Board[]> {
        const res = await pool.query('SELECT * FROM boards WHERE team_id = $1 ORDER BY created_at DESC', [teamId]);
        return res.rows.map(this.mapBoard);
    }

    async createBoard(title: string, teamId: string, options?: { initialColumns?: { title: string; color: string }[], maxVotes?: number }): Promise<Board> {
        const id = crypto.randomUUID();
        // Get user from context or hardcode for now (API route should pass it)
        const userId = null; // Should come from session

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `INSERT INTO boards (id, team_id, title, max_votes, column_colors) VALUES ($1, $2, $3, $4, $5)`,
                [id, teamId, title, options?.maxVotes, []]
            );

            if (options?.initialColumns) {
                for (let i = 0; i < options.initialColumns.length; i++) {
                    const col = options.initialColumns[i];
                    await client.query(
                        'INSERT INTO columns (id, board_id, title, color, order_index) VALUES ($1, $2, $3, $4, $5)',
                        [crypto.randomUUID(), id, col.title, col.color, i]
                    );
                }
            } else {
                // Defaults
                const defaults = [
                    { title: 'Start', color: 'bg-teal-600', order: 0 },
                    { title: 'Stop', color: 'bg-rose-600', order: 1 },
                    { title: 'Continue', color: 'bg-violet-600', order: 2 },
                ];
                for (const col of defaults) {
                    await client.query(
                        'INSERT INTO columns (id, board_id, title, color, order_index) VALUES ($1, $2, $3, $4, $5)',
                        [crypto.randomUUID(), id, col.title, col.color, col.order]
                    );
                }
            }

            await client.query('COMMIT');

            const board = await this.getBoard(id);
            return board!;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async getBoard(boardId: string): Promise<Board | null> {
        const res = await pool.query('SELECT * FROM boards WHERE id = $1', [boardId]);
        return res.rows[0] ? this.mapBoard(res.rows[0]) : null;
    }

    async updateBoard(boardId: string, updates: Partial<Board>): Promise<Board | null> {
        // Similar dynamic update logic
        if (Object.keys(updates).length === 0) return this.getBoard(boardId);
        // Simplified for brevity - assumes full update implementation
        return this.getBoard(boardId);
    }

    async cloneBoard(boardId: string, newTitle?: string): Promise<Board> {
        // Complex cloning logic with transactions
        // Skipping implementation details for this snippet, but concept matches LocalStorage logic adapted to SQL
        throw new Error("Method not implemented.");
    }

    async deleteBoard(boardId: string): Promise<void> {
        await pool.query('DELETE FROM boards WHERE id = $1', [boardId]);
    }

    // --- Columns ---
    async getColumns(boardId: string): Promise<Column[]> {
        const res = await pool.query('SELECT * FROM columns WHERE board_id = $1 ORDER BY order_index ASC', [boardId]);
        return res.rows;
    }

    async createColumn(boardId: string, title: string): Promise<Column> {
        const id = crypto.randomUUID();
        const maxOrderRes = await pool.query('SELECT MAX(order_index) as m FROM columns WHERE board_id = $1', [boardId]);
        const order = (maxOrderRes.rows[0]?.m ?? -1) + 1;

        await pool.query('INSERT INTO columns (id, board_id, title, order_index) VALUES ($1, $2, $3, $4)', [id, boardId, title, order]);
        const res = await pool.query('SELECT * FROM columns WHERE id = $1', [id]);
        return res.rows[0];
    }

    async updateColumn(columnId: string, title: string): Promise<Column | null> {
        await pool.query('UPDATE columns SET title = $1 WHERE id = $2', [title, columnId]);
        const res = await pool.query('SELECT * FROM columns WHERE id = $1', [columnId]);
        return res.rows[0];
    }

    async updateColumnColor(columnId: string, color: string): Promise<void> {
        await pool.query('UPDATE columns SET color = $1 WHERE id = $2', [color, columnId]);
    }

    async deleteColumn(columnId: string): Promise<void> {
        await pool.query('DELETE FROM columns WHERE id = $1', [columnId]);
    }

    // --- Cards ---
    async getCards(columnId: string): Promise<Card[]> {
        // Need to join votes and comments to construct full object? Or fetch separately?
        // Simple fetch for now
        const res = await pool.query('SELECT * FROM cards WHERE column_id = $1', [columnId]);
        const cards = res.rows.map(this.mapCard);

        // Fetch comments and attach?
        // OR better: single query with JSON aggregation
        // keeping simple for MVP
        return cards;
    }

    async createCard(columnId: string, content: string, authorId: string, options?: any): Promise<Card> {
        const id = crypto.randomUUID();
        await pool.query(
            'INSERT INTO cards (id, column_id, content, author_id, author_full_name, author_avatar_url, is_anonymous) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, columnId, content, authorId, options?.authorName, options?.authorAvatar, options?.isAnonymous]
        );
        const res = await pool.query('SELECT * FROM cards WHERE id = $1', [id]);
        return this.mapCard(res.rows[0]);
    }

    async updateCard(cardId: string, content: string): Promise<Card | null> {
        await pool.query('UPDATE cards SET content = $1 WHERE id = $2', [content, cardId]);
        const res = await pool.query('SELECT * FROM cards WHERE id = $1', [cardId]);
        return this.mapCard(res.rows[0]);
    }

    async deleteCard(cardId: string): Promise<void> {
        await pool.query('DELETE FROM cards WHERE id = $1', [cardId]);
    }

    async updateCardPosition(cardId: string, newColumnId: string, newIndex: number): Promise<void> {
        await pool.query('UPDATE cards SET column_id = $1 WHERE id = $2', [newColumnId, cardId]);
    }

    async voteCard(cardId: string, userId: string): Promise<void> {
        // Using array logic for simplicity matching local storage
        const res = await pool.query('SELECT voted_user_ids, votes FROM cards WHERE id = $1', [cardId]);
        let { voted_user_ids, votes } = res.rows[0];
        if (!voted_user_ids) voted_user_ids = [];

        if (voted_user_ids.includes(userId)) {
            voted_user_ids = voted_user_ids.filter((id: string) => id !== userId);
            votes = Math.max(0, votes - 1);
        } else {
            voted_user_ids.push(userId);
            votes++;
        }

        await pool.query('UPDATE cards SET votes = $1, voted_user_ids = $2 WHERE id = $3', [votes, voted_user_ids, cardId]);
    }

    async updateCardColor(cardId: string, color: string): Promise<void> {
        await pool.query('UPDATE cards SET color = $1 WHERE id = $2', [color, cardId]);
    }

    async addComment(cardId: string, text: string, authorId: string): Promise<void> {
        await pool.query(
            'INSERT INTO comments (id, card_id, text, author_id) VALUES ($1, $2, $3, $4)',
            [crypto.randomUUID(), cardId, text, authorId]
        );
    }

    async deleteComment(cardId: string, commentId: string): Promise<void> {
        await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    }

    async broadcastReaction(boardId: string, emoji: string, userId: string): Promise<void> {
        // No-op for SQL, handled by ephemeral events usually
    }

    // --- Helpers ---
    private mapUser(row: any): User {
        return {
            id: row.id,
            email: row.email,
            full_name: row.full_name,
            avatar_url: row.avatar_url,
            role: row.role,
            last_login_at: row.last_login_at,
            created_at: row.created_at
        };
    }

    private mapBoard(row: any): Board {
        return {
            ...row,
            allowed_user_ids: row.allowed_user_ids || []
        };
    }

    private mapCard(row: any): Card {
        return {
            ...row,
            votes: row.votes || 0,
            voted_user_ids: row.voted_user_ids || [],
            isAnonymous: row.is_anonymous, // Map snake_case from DB to camelCase for Frontend
            comments: [] // Needs separate join
        };
    }

    // Helper query for count
    private async getUserCount(): Promise<number> {
        const res = await pool.query('SELECT COUNT(*) FROM users');
        return parseInt(res.rows[0].count);
    }
}
