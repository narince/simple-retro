
import * as XLSX from 'xlsx';
import { apiService } from './api-service';
import { User, Board, Card, Column } from './types';

export class DataExportService {

    async exportDatabase() {
        // Fetch all data from API
        const data = await apiService.getExportData();
        const { users, boards, cards, columns, reactions } = data;

        // Create workbook
        const wb = XLSX.utils.book_new();

        // 1. Users Sheet
        const usersWs = XLSX.utils.json_to_sheet(users.map((u: any) => ({
            ID: u.id,
            Email: u.email,
            "Full Name": u.full_name,
            Role: u.role,
            "Created At": u.created_at || '',
            "Last Login": u.last_login_at
        })));
        XLSX.utils.book_append_sheet(wb, usersWs, "Users");

        // 2. Boards Sheet
        const boardsWs = XLSX.utils.json_to_sheet(boards.map((b: any) => ({
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
        const colsWs = XLSX.utils.json_to_sheet(columns.map((c: any) => ({
            ID: c.id,
            BoardID: c.board_id,
            Title: c.title,
            Color: c.color,
            Order: c.order_index
        })));
        XLSX.utils.book_append_sheet(wb, colsWs, "Columns");

        // Helper map for Column -> Board
        const columnBoardMap = new Map<string, string>();
        columns.forEach((c: any) => columnBoardMap.set(c.id, c.board_id));

        // 4. Cards Sheet
        const cardsWs = XLSX.utils.json_to_sheet(cards.map((c: any) => ({
            ID: c.id,
            "Board ID": columnBoardMap.get(c.column_id) || 'Unknown',
            "Column ID": c.column_id,
            Content: c.content,
            "Author ID": c.author_id,
            "Author Name": c.author_name || '',
            Votes: c.votes,
            "Voted User IDs": c.voted_user_ids?.join(',') || '',
            "Is Anonymous": c.isAnonymous ? "Yes" : "No",
            "Color": c.color || '',
            "Created At": c.created_at
        })));
        XLSX.utils.book_append_sheet(wb, cardsWs, "Cards");

        // 5. Comments Sheet (Flattened from Cards)
        const comments: any[] = [];
        cards.forEach((card: any) => {
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
        boards.forEach((board: any) => {
            if (board.allowed_user_ids && Array.isArray(board.allowed_user_ids)) {
                board.allowed_user_ids.forEach((uid: any) => {
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

        // 7. Reactions
        if (reactions && reactions.length > 0) {
            const reactionsWs = XLSX.utils.json_to_sheet(reactions);
            XLSX.utils.book_append_sheet(wb, reactionsWs, "Reactions");
        }

        // Generate filename with timestamp
        const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `retroboard_full_backup_${date}.xlsx`;

        // Export
        XLSX.writeFile(wb, filename);
    }
}

export const dataExportService = new DataExportService();
