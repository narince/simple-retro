
import { IDataService } from './interface';
import { User, Board, Column, Card } from './types';

const API_BASE = '/api';

export class ApiService implements IDataService {

    // --- Auth ---
    async signIn(email: string): Promise<{ user: User | null; error: string | null }> {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!res.ok) {
                const data = await res.json();
                return { user: null, error: data.error || 'Login failed' };
            }

            const user = await res.json();
            // Client side session logic
            if (typeof window !== 'undefined') {
                localStorage.setItem('retro_session', JSON.stringify(user));
            }
            return { user, error: null };
        } catch (err: any) {
            return { user: null, error: err.message };
        }
    }

    async signUp(email: string): Promise<{ user: User | null; error: string | null }> {
        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!res.ok) {
                const data = await res.json();
                return { user: null, error: data.error || 'Signup failed' };
            }

            const user = await res.json();
            if (typeof window !== 'undefined') {
                localStorage.setItem('retro_session', JSON.stringify(user));
            }
            return { user, error: null };
        } catch (err: any) {
            return { user: null, error: err.message };
        }
    }

    async getCurrentUser(): Promise<User | null> {
        if (typeof window === 'undefined') return null;
        const session = localStorage.getItem('retro_session');
        return session ? JSON.parse(session) : null;
    }

    async signOut(): Promise<void> {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('retro_session');
        }
    }

    // --- Users (Admin) ---
    async getUsers(): Promise<User[]> {
        const res = await fetch(`${API_BASE}/users`, { cache: 'no-store' });
        return res.json();
    }

    async createUser(email: string, fullName: string, role: string): Promise<User> {
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            body: JSON.stringify({ email, full_name: fullName, role })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        return res.json();
    }

    // Stubbing other user methods for brevity/MVP
    async deleteUser(userId: string): Promise<void> {
        await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
    }

    async updateUser(updates: Partial<User>): Promise<User | null> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return null;

        const res = await fetch(`${API_BASE}/users/${currentUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!res.ok) return null;
        const updated = await res.json();

        // Update Session if it's me
        if (typeof window !== 'undefined') {
            localStorage.setItem('retro_session', JSON.stringify(updated));
        }
        return updated;
    }

    async updateUserAvatar(avatarUrl: string): Promise<void> {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return;

        await this.updateUser({ avatar_url: avatarUrl });
    }

    async updateUserRole(userId: string, role: string): Promise<void> {
        await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
    }

    async adminUpdateUser(userId: string, updates: Partial<User>): Promise<void> {
        await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }

    async updateUserPassword(userId: string, pass: string): Promise<void> {
        // In a real app we'd hash, here mock updates
        await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pass }) // or whatever field
        });
    }


    // --- Boards ---
    async getBoards(teamId: string): Promise<Board[]> {
        const res = await fetch(`${API_BASE}/boards`);
        return res.json();
    }

    async createBoard(title: string, teamId: string, options?: any): Promise<Board> {
        const currentUser = await this.getCurrentUser();
        const res = await fetch(`${API_BASE}/boards`, {
            method: 'POST',
            body: JSON.stringify({ title, teamId, options, creatorId: currentUser?.id })
        });
        return res.json();
    }

    async getBoard(boardId: string): Promise<Board | null> {
        const res = await fetch(`${API_BASE}/boards/${boardId}`);
        if (!res.ok) return null;
        return res.json();
    }

    async updateBoard(boardId: string, updates: Partial<Board>): Promise<Board | null> {
        const res = await fetch(`${API_BASE}/boards/${boardId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return res.json();
    }

    async deleteBoard(boardId: string): Promise<void> {
        await fetch(`${API_BASE}/boards/${boardId}`, { method: 'DELETE' });
    }

    async cloneBoard(boardId: string, newTitle?: string): Promise<Board> {
        const res = await fetch(`${API_BASE}/boards/${boardId}/clone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newTitle })
        });
        if (!res.ok) throw new Error("Failed to clone board");
        return res.json();
    }

    async inviteUserToBoard(boardId: string, userId: string): Promise<void> {
        const board = await this.getBoard(boardId);
        if (!board) return;

        const currentAllowed = board.allowed_user_ids || [];
        if (currentAllowed.includes(userId)) return;

        const newAllowed = [...currentAllowed, userId];
        await this.updateBoard(boardId, { allowed_user_ids: newAllowed });
    }


    // --- Columns ---
    async getColumns(boardId: string): Promise<Column[]> {
        const res = await fetch(`${API_BASE}/columns?boardId=${boardId}`);
        return res.json();
    }

    async createColumn(boardId: string, title: string): Promise<Column> {
        const res = await fetch(`${API_BASE}/columns`, {
            method: 'POST',
            body: JSON.stringify({ boardId, title })
        });
        return res.json();
    }

    async updateColumn(columnId: string, title: string): Promise<Column | null> {
        const res = await fetch(`${API_BASE}/columns/${columnId}`, { // Need route
            method: 'PATCH',
            body: JSON.stringify({ title })
        });
        return res.json();
    }

    async deleteColumn(columnId: string): Promise<void> {
        await fetch(`${API_BASE}/columns/${columnId}`, { method: 'DELETE' });
    }
    async updateColumnColor(id: string, color: string): Promise<void> {
        await fetch(`${API_BASE}/columns/${id}`, { method: 'PATCH', body: JSON.stringify({ color }) });
    }


    // --- Cards ---
    async getCards(columnId: string): Promise<Card[]> {
        const res = await fetch(`${API_BASE}/cards?columnId=${columnId}`);
        return res.json();
    }

    async createCard(columnId: string, content: string, authorId: string, options?: any): Promise<Card> {
        const res = await fetch(`${API_BASE}/cards`, {
            method: 'POST',
            body: JSON.stringify({ columnId, content, authorId, options })
        });
        return res.json();
    }

    async updateCard(cardId: string, content: string): Promise<Card | null> {
        const res = await fetch(`${API_BASE}/cards/${cardId}`, {
            method: 'PATCH',
            body: JSON.stringify({ content })
        });
        return res.json();
    }

    async deleteCard(cardId: string): Promise<void> {
        await fetch(`${API_BASE}/cards/${cardId}`, { method: 'DELETE' });
    }

    async voteCard(cardId: string, userId: string): Promise<void> {
        // Need dedicated vote endpoint or PATCH
        await fetch(`${API_BASE}/cards/${cardId}/vote`, { method: 'POST', body: JSON.stringify({ userId }) });
    }

    async updateCardColor(cardId: string, color: string): Promise<void> {
        await fetch(`${API_BASE}/cards/${cardId}`, { method: 'PATCH', body: JSON.stringify({ color }) });
    }

    async addComment(cardId: string, text: string, authorId: string): Promise<void> {
        await fetch(`${API_BASE}/cards/${cardId}/comments`, { method: 'POST', body: JSON.stringify({ text, authorId }) });
    }
    async deleteComment(cardId: string, commentId: string): Promise<void> {
        await fetch(`${API_BASE}/cards/${cardId}/comments/${commentId}`, { method: 'DELETE' });
    }

    async updateCardPosition(cardId: string, newColId: string, idx: number): Promise<void> {
        await fetch(`${API_BASE}/cards/${cardId}`, { method: 'PATCH', body: JSON.stringify({ column_id: newColId }) });
    }

    async broadcastReaction(boardId: string, emoji: string, userId: string): Promise<void> {
        await fetch(`${API_BASE}/reactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, emoji, userId })
        });
    }
}
