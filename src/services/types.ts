
export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: 'admin' | 'user';
    last_login_at?: string;
    last_logout_at?: string;
    created_at?: string;
}

export interface Team {
    id: string;
    name: string;
    created_at: string;
}

export interface Board {
    id: string;
    team_id: string;
    title: string;
    created_by: string;
    owner_id?: string;
    is_locked: boolean;
    are_votes_hidden: boolean;
    is_voting_disabled?: boolean;
    are_cards_hidden?: boolean;
    max_votes?: number;
    max_votes_scope?: 'board' | 'column'; // 'board' or 'column'
    is_archived?: boolean;
    column_colors?: string[]; // For dashboard preview
    created_at: string;
    allowed_user_ids?: string[]; // IDs of users who can access this board

    // Feature Flags
    is_gifs_enabled?: boolean;
    is_reactions_enabled?: boolean;
    is_comments_enabled?: boolean;
    password?: string; // If set, board is password protected
}

export interface Column {
    id: string;
    board_id: string;
    title: string;
    color: string;
    order_index: number;
    created_at: string;
}

export interface Comment {
    id: string;
    text: string;
    author_id: string;
    created_at: string;
}

export interface Card {
    id: string;
    column_id: string;
    content: string;
    author_id: string;
    author_full_name?: string;
    author_avatar_url?: string;
    is_anonymous?: boolean;
    author_name?: string;
    author_avatar?: string;
    position?: number;
    votes: number;
    voted_user_ids?: string[];
    comments: Comment[];
    color?: string; // Hex or tailwind class
    created_at: string;
}
