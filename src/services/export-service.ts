
import * as XLSX from 'xlsx';
import { LocalStorageService, STORAGE_KEYS } from './local-storage-service';
import { User, Board, Card, Column } from './types';

export class DataExportService {
    private storage: LocalStorageService;

    constructor() {
        this.storage = new LocalStorageService();
    }

    exportDatabase() {
        // Fetch all data
        const users = this.storage.get<User>(STORAGE_KEYS.USERS);
        const boards = this.storage.get<Board>(STORAGE_KEYS.BOARDS);
        const cards = this.storage.get<Card>(STORAGE_KEYS.CARDS);
        const columns = this.storage.get<Column>(STORAGE_KEYS.COLUMNS);

        // Create workbook
        const wb = XLSX.utils.book_new();

        // 1. Users Sheet
        const usersWs = XLSX.utils.json_to_sheet(users.map(u => ({
            ID: u.id,
            Email: u.email,
            "Full Name": u.full_name,
            Role: u.role,
            "Created At": u.created_at || '', // If we track it
            "Last Login": u.last_login_at
        })));
        XLSX.utils.book_append_sheet(wb, usersWs, "Users");

        // 2. Boards Sheet
        const boardsWs = XLSX.utils.json_to_sheet(boards.map(b => ({
            ID: b.id,
            Title: b.title,
            "Team ID": b.team_id,
            "Owner ID": b.owner_id || b.created_by,
            "Max Votes": b.max_votes,
            "Is Archived": b.is_archived ? "Yes" : "No",
            "Vote Hiding": b.are_votes_hidden ? "Hidden" : "Visible",
            "Created At": b.created_at
        })));
        XLSX.utils.book_append_sheet(wb, boardsWs, "Boards");

        // 3. Columns Sheet
        const colsWs = XLSX.utils.json_to_sheet(columns.map(c => ({
            ID: c.id,
            BoardID: c.board_id,
            Title: c.title,
            Color: c.color,
            Order: c.order_index
        })));
        XLSX.utils.book_append_sheet(wb, colsWs, "Columns");

        // Helper map for Column -> Board
        const columnBoardMap = new Map<string, string>();
        columns.forEach(c => columnBoardMap.set(c.id, c.board_id));

        // 4. Cards Sheet
        const cardsWs = XLSX.utils.json_to_sheet(cards.map(c => ({
            ID: c.id,
            "Board ID": columnBoardMap.get(c.column_id) || 'Unknown',
            "Column ID": c.column_id,
            Content: c.content,
            "Author ID": c.author_id,
            "Author Name": c.author_name || '',
            Votes: c.votes,
            "Voted User IDs": c.voted_user_ids?.join(',') || '',
            "Is Anonymous": c.is_anonymous ? "Yes" : "No",
            "Color": c.color || '',
            "Created At": c.created_at
        })));
        XLSX.utils.book_append_sheet(wb, cardsWs, "Cards");

        // 5. Comments Sheet (Flattened from Cards)
        const comments: any[] = [];
        cards.forEach(card => {
            if (card.comments && Array.isArray(card.comments)) {
                card.comments.forEach((comment: any) => {
                    comments.push({
                        "ID": comment.id || crypto.randomUUID(),
                        "Card ID": card.id,
                        "Board ID": columnBoardMap.get(card.column_id) || 'Unknown',
                        "Author ID": comment.author_id,
                        "Text": comment.text,
                        "Created At": comment.created_at
                    });
                });
            }
        });

        if (comments.length > 0) {
            const commentsWs = XLSX.utils.json_to_sheet(comments);
            XLSX.utils.book_append_sheet(wb, commentsWs, "Comments");
        }

        // 6. Board Members Sheet (Flattened from Boards)
        const boardMembers: any[] = [];
        boards.forEach(board => {
            if (board.allowed_user_ids && Array.isArray(board.allowed_user_ids)) {
                board.allowed_user_ids.forEach(uid => {
                    boardMembers.push({
                        "Board ID": board.id,
                        "Board Title": board.title,
                        "User ID": uid
                    });
                });
            }
        });

        if (boardMembers.length > 0) {
            const membersWs = XLSX.utils.json_to_sheet(boardMembers);
            XLSX.utils.book_append_sheet(wb, membersWs, "Board_Members");
        }

        // Generate filename with timestamp
        const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `retroboard_full_backup_${date}.xlsx`;

        // Export
        XLSX.writeFile(wb, filename);
    }
}

export const dataExportService = new DataExportService();
