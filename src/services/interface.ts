
import { User, Board, Column, Card } from './types';

export interface IDataService {
    // Auth
    signIn(email: string): Promise<{ user: User | null; error: string | null }>;
    signUp(email: string): Promise<{ user: User | null; error: string | null }>;
    getCurrentUser(): Promise<User | null>;
    updateUser(updates: Partial<User>): Promise<User | null>;
    signOut(): Promise<void>;

    // Board
    getBoards(teamId: string): Promise<Board[]>;
    createBoard(title: string, teamId: string, options?: { initialColumns?: { title: string; color: string }[], maxVotes?: number }): Promise<Board>;
    getBoard(boardId: string): Promise<Board | null>;
    updateBoard(boardId: string, updates: Partial<Board>): Promise<Board | null>;
    deleteBoard(boardId: string): Promise<void>;
    cloneBoard(boardId: string, newTitle?: string): Promise<Board>;

    // Columns & Cards
    // Cards
    getCards(columnId: string): Promise<Card[]>;
    createCard(columnId: string, content: string, authorId: string, options?: { isAnonymous?: boolean, authorName?: string, authorAvatar?: string }): Promise<Card>;
    updateCard(cardId: string, content: string): Promise<Card | null>;
    deleteCard(cardId: string): Promise<void>;
    updateCardPosition(cardId: string, newColumnId: string, newIndex: number): Promise<void>;
    voteCard(cardId: string, userId: string): Promise<void>;
    updateCardColor(cardId: string, color: string): Promise<void>;
    addComment(cardId: string, text: string, authorId: string): Promise<void>;
    deleteComment(cardId: string, commentId: string): Promise<void>;

    // Columns
    getColumns(boardId: string): Promise<Column[]>;
    createColumn(boardId: string, title: string): Promise<Column>;
    updateColumn(columnId: string, title: string): Promise<Column | null>;
    deleteColumn(columnId: string): Promise<void>;
    updateColumnColor(columnId: string, color: string): Promise<void>;

    // Reactions & Misc
    broadcastReaction(boardId: string, emoji: string, userId: string): Promise<void>;
    updateUserAvatar(avatarUrl: string): Promise<void>;
    getUsers(): Promise<User[]>;
    inviteUserToBoard(boardId: string, userId: string): Promise<void>;

    // Admin
    deleteUser(userId: string): Promise<void>;
    updateUserPassword(userId: string, password: string): Promise<void>;
    updateUserRole(userId: string, role: 'admin' | 'user'): Promise<User | null>;
    createUser(email: string, fullName: string, role: 'admin' | 'user', password?: string): Promise<User>;
    adminUpdateUser(userId: string, updates: Partial<User>): Promise<User | null>;
}
