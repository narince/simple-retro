
import { IDataService } from './interface';
import { User, Board, Column, Card } from './types';
import { sanitize } from '@/lib/security';

export const STORAGE_KEYS = {
    USERS: 'retro_users',
    BOARDS: 'retro_boards',
    COLUMNS: 'retro_columns',
    CARDS: 'retro_cards',
    COMMENTS: 'retro_comments',
    SESSION: 'retro_session'
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class LocalStorageService implements IDataService {
    async getExportData(): Promise<any> {
        throw new Error("Export not supported in LocalStorage mode");
    }

    public get<T>(key: string): T[] {
        if (typeof window === 'undefined') return [];
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    }

    private set<T>(key: string, data: T[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, JSON.stringify(data));
    }

    // --- Auth ---
    async signIn(email: string): Promise<{ user: User | null; error: string | null }> {
        await delay(300); // Simulate network
        const normalizedEmail = email.trim().toLocaleLowerCase('tr-TR');
        const users = this.get<User>(STORAGE_KEYS.USERS);
        // Fallback to standard check if strict locale check fails, or just use one standard.
        // Let's stick to simple comparison but robust against casing.
        const user = users.find(u => u.email.trim().toLocaleLowerCase('tr-TR') === normalizedEmail);

        if (!user) {
            return { user: null, error: 'AUTH_USER_NOT_FOUND' };
        }

        // Update last login
        user.last_login_at = new Date().toISOString();

        // HACK: Auto-promote specific user to admin on login
        if (user.email === 'tolga.narince@ode.al') {
            user.role = 'admin';
        }

        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex >= 0) {
            users[userIndex] = user;
            this.set(STORAGE_KEYS.USERS, users);
        }

        // Set Session
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        }

        return { user, error: null };
    }

    async signUp(email: string): Promise<{ user: User | null; error: string | null }> {
        await delay(300);
        const normalizedEmail = email.trim().toLowerCase();
        const users = this.get<User>(STORAGE_KEYS.USERS);

        if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
            return { user: null, error: 'AUTH_USER_EXISTS' };
        }

        // First user is admin
        const isFirstUser = users.length === 0;

        const newUser: User = {
            id: crypto.randomUUID(),
            email: normalizedEmail,
            full_name: normalizedEmail.split('@')[0],
            // avatar_url: removed to use fallback
            role: isFirstUser ? 'admin' : 'user',
            last_login_at: new Date().toISOString()
        };

        users.push(newUser);
        this.set(STORAGE_KEYS.USERS, users);

        // Auto sign-in after sign-up
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newUser));
        }

        return { user: newUser, error: null };
    }

    async getCurrentUser(): Promise<User | null> {
        if (typeof window === 'undefined') return null;
        const session = localStorage.getItem(STORAGE_KEYS.SESSION);
        return session ? JSON.parse(session) : null;
    }

    async updateUser(updates: Partial<User>): Promise<User | null> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return null;

        const updatedUser = { ...currentUser, ...updates };

        // Update Session
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
        }

        // Update in Users List
        const users = this.get<User>(STORAGE_KEYS.USERS);
        const index = users.findIndex(u => u.id === currentUser.id);
        if (index > -1) {
            users[index] = updatedUser;
            this.set(STORAGE_KEYS.USERS, users);
        }

        return updatedUser;
    }

    async updateUserAvatar(avatarUrl: string): Promise<void> {
        await this.updateUser({ avatar_url: avatarUrl });
    }

    async getUsers(): Promise<User[]> {
        return this.get<User>(STORAGE_KEYS.USERS);
    }

    async inviteUserToBoard(boardId: string, userId: string): Promise<void> {
        const boards = this.get<Board>(STORAGE_KEYS.BOARDS);
        const boardIndex = boards.findIndex(b => b.id === boardId);

        if (boardIndex > -1) {
            const board = boards[boardIndex];
            if (!board.allowed_user_ids) {
                // If starting fresh, include creator (we don't track creator ID perfectly here, but assume current flow)
                // Actually, if allowed_user_ids is undefined currently, it implies public or no restriction.
                // Switching to restricted mode: assume current users + creator should be in.
                board.allowed_user_ids = [];
            }

            if (!board.allowed_user_ids.includes(userId)) {
                board.allowed_user_ids.push(userId);
                boards[boardIndex] = board;
                this.set(STORAGE_KEYS.BOARDS, boards);
            }
        }
    }

    async signOut(): Promise<void> {
        if (typeof window === 'undefined') return;

        // Record logout time
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
            const users = this.get<User>(STORAGE_KEYS.USERS);
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex >= 0) {
                users[userIndex].last_logout_at = new Date().toISOString();
                this.set(STORAGE_KEYS.USERS, users);
            }
        }

        localStorage.removeItem(STORAGE_KEYS.SESSION);
    }

    // --- Boards ---
    async getBoards(teamId: string): Promise<Board[]> {
        await delay(200);
        // Return all boards for now (Team ID ignored for local demo simplified)
        return this.get<Board>(STORAGE_KEYS.BOARDS);
    }

    async createBoard(title: string, teamId: string, options?: { initialColumns?: { title: string; color: string }[], maxVotes?: number }): Promise<Board> {
        const boards = this.get<Board>(STORAGE_KEYS.BOARDS);
        const user = await this.getCurrentUser(); // Fetch user properly

        let defaultCols: { title: string; color: string; order?: number }[] = [];

        if (options?.initialColumns) {
            defaultCols = options.initialColumns.map((c, i) => ({ ...c, order: i }));
        } else {
            defaultCols = [
                { title: 'Start', color: 'bg-teal-600', order: 0 },
                { title: 'Stop', color: 'bg-rose-600', order: 1 },
                { title: 'Continue', color: 'bg-violet-600', order: 2 },
            ];
        }

        const newBoard: Board = {
            id: crypto.randomUUID(),
            team_id: teamId,
            title,
            created_by: 'local-user',
            is_locked: false,
            are_votes_hidden: false,
            is_voting_disabled: false,
            are_cards_hidden: false,
            max_votes: options?.maxVotes,
            is_archived: false,
            column_colors: defaultCols.map(c => c.color),
            created_at: new Date().toISOString(),
            allowed_user_ids: user ? [user.id] : []
        };
        boards.push(newBoard);
        this.set(STORAGE_KEYS.BOARDS, boards);

        // Initialize Columns
        const columns = this.get<Column>(STORAGE_KEYS.COLUMNS);

        defaultCols.forEach((c) => {
            columns.push({
                id: crypto.randomUUID(),
                board_id: newBoard.id,
                title: c.title,
                color: c.color,
                order_index: c.order ?? 0,
                created_at: new Date().toISOString()
            });
        });
        this.set(STORAGE_KEYS.COLUMNS, columns);

        return newBoard;
    }

    async getBoard(boardId: string): Promise<Board | null> {
        await delay(100);
        const boards = this.get<Board>(STORAGE_KEYS.BOARDS);
        return boards.find(b => b.id === boardId) || null;
    }

    async updateBoard(boardId: string, updates: Partial<Board>): Promise<Board | null> {
        const boards = this.get<Board>(STORAGE_KEYS.BOARDS);
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex > -1) {
            boards[boardIndex] = { ...boards[boardIndex], ...updates };
            this.set(STORAGE_KEYS.BOARDS, boards);
            return boards[boardIndex];
        }
        return null;
    }

    async cloneBoard(boardId: string, newTitle?: string): Promise<Board> {
        const board = await this.getBoard(boardId);
        if (!board) throw new Error("Board not found");

        const titleToUse = newTitle || `${board.title} (Clone)`;

        // 1. Create New Board
        const newBoard = await this.createBoard(titleToUse, board.team_id, {
            maxVotes: board.max_votes
            // Initial columns are handled below manually to preserve original setup if needed, 
            // but createBoard makes its own. We should reuse `createBoard` without defaults if possible or just clear them.
            // Here createBoard makes defaults. We clear them.
        });

        // 2. Clear default columns (createBoard adds defaults)
        let columns = this.get<Column>(STORAGE_KEYS.COLUMNS);
        columns = columns.filter(c => c.board_id !== newBoard.id); // Remove auto-created defaults
        this.set(STORAGE_KEYS.COLUMNS, columns);

        // 3. Clone Columns & Cards
        const oldColumns = await this.getColumns(boardId);
        columns = this.get<Column>(STORAGE_KEYS.COLUMNS); // Refresh
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);

        for (const col of oldColumns) {
            const newColId = crypto.randomUUID();
            columns.push({
                ...col,
                id: newColId,
                board_id: newBoard.id,
                created_at: new Date().toISOString()
            });

            // Clone cards for this column
            const colCards = await this.getCards(col.id);
            colCards.forEach(card => {
                cards.push({
                    ...card,
                    id: crypto.randomUUID(),
                    column_id: newColId,
                    votes: 0, // Reset votes
                    created_at: new Date().toISOString()
                });
            });
        }

        this.set(STORAGE_KEYS.COLUMNS, columns);
        this.set(STORAGE_KEYS.CARDS, cards);

        // Sync Board Colors for Dashboard Preview
        await this.syncBoardColors(newBoard.id);

        return newBoard;
    }

    async deleteBoard(boardId: string): Promise<void> {
        const boards = this.get<Board>(STORAGE_KEYS.BOARDS);
        const newBoards = boards.filter(b => b.id !== boardId);
        this.set(STORAGE_KEYS.BOARDS, newBoards);

        // Cascade delete columns and cards
        const columns = this.get<Column>(STORAGE_KEYS.COLUMNS);
        const colsToDelete = columns.filter(c => c.board_id === boardId);
        const newCols = columns.filter(c => c.board_id !== boardId);
        this.set(STORAGE_KEYS.COLUMNS, newCols);

        const cards = this.get<Card>(STORAGE_KEYS.CARDS);
        const colIds = colsToDelete.map(c => c.id);
        const newCards = cards.filter(c => !colIds.includes(c.column_id));
        this.set(STORAGE_KEYS.CARDS, newCards);
    }

    // --- Columns & Cards ---
    async getColumns(boardId: string): Promise<Column[]> {
        await delay(100);
        const allCols = this.get<Column>(STORAGE_KEYS.COLUMNS);
        return allCols.filter(c => c.board_id === boardId).sort((a, b) => a.order_index - b.order_index);
    }

    async createColumn(boardId: string, title: string): Promise<Column> {
        const columns = this.get<Column>(STORAGE_KEYS.COLUMNS);
        // Find max order
        const boardCols = columns.filter(c => c.board_id === boardId);
        const maxOrder = boardCols.reduce((max, c) => Math.max(max, c.order_index), -1);

        const newCol: Column = {
            id: crypto.randomUUID(),
            board_id: boardId,
            title,
            color: 'bg-slate-500', // Default color, user can maybe change later
            order_index: maxOrder + 1,
            created_at: new Date().toISOString()
        };
        columns.push(newCol);
        this.set(STORAGE_KEYS.COLUMNS, columns);

        // Sync Board Colors for Dashboard Preview
        await this.syncBoardColors(boardId);

        return newCol;
    }

    async getCards(columnId: string): Promise<Card[]> {
        // No artificial delay here for snappiness
        const allCards = this.get<Card>(STORAGE_KEYS.CARDS);
        return allCards.filter(c => c.column_id === columnId);
    }
    // ... existing code ...

    async deleteColumn(columnId: string): Promise<void> {
        const columns = this.get<Column>(STORAGE_KEYS.COLUMNS);
        const colToDelete = columns.find(c => c.id === columnId);
        if (!colToDelete) return; // Column not found

        const newCols = columns.filter(c => c.id !== columnId);
        this.set(STORAGE_KEYS.COLUMNS, newCols);

        // Also delete cards in column? For now keep them or orphan them. 
        // Better to delete.
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);
        const newCards = cards.filter(c => c.column_id !== columnId);
        this.set(STORAGE_KEYS.CARDS, newCards);

        // Sync Board Colors for Dashboard Preview
        // use colToDelete.board_id
        await this.syncBoardColors(colToDelete.board_id);
    }

    async createCard(columnId: string, content: string, authorId: string, options?: { isAnonymous?: boolean, authorName?: string, authorAvatar?: string }): Promise<Card> {
        await delay(200);
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);

        const safeContent = sanitize(content);

        const newCard: Card = {
            id: crypto.randomUUID(),
            column_id: columnId,
            content: safeContent,
            author_id: authorId,
            votes: 0,
            comments: [],
            isAnonymous: options?.isAnonymous,
            author_name: options?.authorName,
            author_avatar: options?.authorAvatar,
            created_at: new Date().toISOString()
        };
        cards.push(newCard);
        this.set(STORAGE_KEYS.CARDS, cards);
        return newCard;
    }

    async updateCardPosition(cardId: string, newColumnId: string, _newIndex: number): Promise<void> {
        // Simplified: Just update parent column. Full reordering requires index management.
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);
        const cardIndex = cards.findIndex(c => c.id === cardId);
        if (cardIndex > -1) {
            cards[cardIndex].column_id = newColumnId;
            this.set(STORAGE_KEYS.CARDS, cards);
        }
    }

    async updateCard(cardId: string, content: string): Promise<Card | null> {
        await delay(200);
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);
        const index = cards.findIndex(c => c.id === cardId);
        if (index > -1) {
            cards[index].content = sanitize(content);
            this.set(STORAGE_KEYS.CARDS, cards);
            return cards[index];
        }
        return null;
    }

    async deleteCard(cardId: string): Promise<void> {
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);
        const newCards = cards.filter(c => c.id !== cardId);
        this.set(STORAGE_KEYS.CARDS, newCards);
    }

    async voteCard(cardId: string, userId: string): Promise<void> {
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);
        const card = cards.find(c => c.id === cardId);
        if (card) {
            if (!card.voted_user_ids) card.voted_user_ids = [];

            // Check if user already voted
            if (card.voted_user_ids.includes(userId)) {
                // Toggle OFF (Unvote)
                card.voted_user_ids = card.voted_user_ids.filter(id => id !== userId);
                card.votes = Math.max(0, card.votes - 1);
            } else {
                // Toggle ON (Vote)
                card.votes += 1;
                card.voted_user_ids.push(userId);
                this.set(STORAGE_KEYS.CARDS, cards);
            }
        }
    }

    async updateCardColor(cardId: string, color: string): Promise<void> {
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);
        const card = cards.find(c => c.id === cardId);
        if (card) {
            card.color = color;
            this.set(STORAGE_KEYS.CARDS, cards);
        }
    }

    async deleteUser(userId: string): Promise<void> {
        await delay(300);
        const users = this.get<User>(STORAGE_KEYS.USERS);
        const newUsers = users.filter(u => u.id !== userId);
        this.set(STORAGE_KEYS.USERS, newUsers);

        // If deleting self, logout
        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            this.signOut();
        }
    }

    async updateUserPassword(_userId: string, _password: string): Promise<void> {
        // Since we don't actually store passwords in this mock service, we just simulate success.
        // In a real app, this would update the hashed password.
        await delay(500);
        return;
    }

    async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<User | null> {
        const users = this.get<User>(STORAGE_KEYS.USERS);
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
            users[userIndex].role = role;
            this.set(STORAGE_KEYS.USERS, users);

            // If updating self, update session
            const currentUser = await this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(users[userIndex]));
                }
            }
            return users[userIndex];
        }
        return null;
    }

    async adminUpdateUser(userId: string, updates: Partial<User>): Promise<User | null> {
        const users = this.get<User>(STORAGE_KEYS.USERS);
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
            users[userIndex] = { ...users[userIndex], ...updates };
            this.set(STORAGE_KEYS.USERS, users);

            // If updating self, update session
            const currentUser = await this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(users[userIndex]));
                }
            }
            return users[userIndex];
        }
        return null;
    }

    async createUser(email: string, fullName: string, role: 'admin' | 'user', _password?: string): Promise<User> {
        await delay(300);
        const normalizedEmail = email.trim().toLocaleLowerCase('tr-TR');
        const users = this.get<User>(STORAGE_KEYS.USERS);

        if (users.find(u => u.email.trim().toLocaleLowerCase('tr-TR') === normalizedEmail)) {
            throw new Error('AUTH_USER_EXISTS');
        }

        const newUser: User = {
            id: crypto.randomUUID(),
            email: normalizedEmail,
            full_name: fullName,
            // avatar_url: removed to use fallback
            role,
            last_login_at: undefined
        };

        users.push(newUser);
        this.set(STORAGE_KEYS.USERS, users);

        return newUser;
    }

    async addComment(cardId: string, text: string, authorId: string): Promise<void> {
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);
        const card = cards.find(c => c.id === cardId);
        if (card) {
            if (!card.comments) card.comments = [];

            // Legacy check migration (if it was string[], clear it or convert? Let's clear to be safe/simple)
            if (card.comments.length > 0 && typeof card.comments[0] === 'string') {
                card.comments = [];
            }

            const newComment: any = { // Cast to any to avoid complex type merging issues with legacy
                id: crypto.randomUUID(),
                text,
                author_id: authorId,
                created_at: new Date().toISOString()
            };

            card.comments.push(newComment);
            this.set(STORAGE_KEYS.CARDS, cards);
        }
    }

    async deleteComment(cardId: string, commentId: string): Promise<void> {
        const cards = this.get<Card>(STORAGE_KEYS.CARDS);
        const card = cards.find(c => c.id === cardId);
        if (card && card.comments) {
            const comments = card.comments as any[];
            if (comments.length > 0 && typeof comments[0] === 'object') {
                card.comments = comments.filter(c => c.id !== commentId);
                this.set(STORAGE_KEYS.CARDS, cards);
            }
        }
    }

    // --- Columns ---
    async updateColumn(columnId: string, title: string): Promise<Column | null> {
        const columns = this.get<Column>(STORAGE_KEYS.COLUMNS);
        const colIndex = columns.findIndex(c => c.id === columnId);
        if (colIndex > -1) {
            columns[colIndex].title = title;
            this.set(STORAGE_KEYS.COLUMNS, columns);
            return columns[colIndex];
        }
        return null;
    }

    async updateColumnColor(columnId: string, color: string): Promise<void> {
        const columns = this.get<Column>(STORAGE_KEYS.COLUMNS);
        const colIndex = columns.findIndex(c => c.id === columnId);
        if (colIndex > -1) {
            columns[colIndex].color = color;
            this.set(STORAGE_KEYS.COLUMNS, columns);

            // Sync Board Colors for Dashboard Preview
            await this.syncBoardColors(columns[colIndex].board_id);
        }
    }

    private async syncBoardColors(boardId: string) {
        const columns = await this.getColumns(boardId);
        // Sort by order
        columns.sort((a, b) => a.order_index - b.order_index);
        const colors = columns.map(c => c.color);

        const boards = this.get<Board>(STORAGE_KEYS.BOARDS);
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex > -1) {
            boards[boardIndex].column_colors = colors;
            this.set(STORAGE_KEYS.BOARDS, boards);
        }
    }



    async getReactions(boardId: string, since: number): Promise<any[]> {
        // Mock implementation for local storage
        if (typeof window === 'undefined') return [];
        const item = localStorage.getItem('retro_reaction_event');
        if (!item) return [];

        const event = JSON.parse(item);
        // Return if matches board and is newer (simple single-event simulation)
        if (event.boardId === boardId && event.timestamp > since) {
            return [event];
        }
        return [];
    }

    // Broadcast Implementation (Storage Event based)
    async broadcastReaction(boardId: string, emoji: string, userId: string, reactionId?: string): Promise<void> {
        const reactionEvent = {
            boardId,
            emoji,
            userId,
            reactionId,
            timestamp: Date.now()
        };
        // Trigger storage event for other tabs
        if (typeof window !== 'undefined') {
            localStorage.setItem('retro_reaction_event', JSON.stringify(reactionEvent));
        }
    }
}
