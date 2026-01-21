
import { create } from 'zustand';

interface AppState {
    currentTeamId: string | null;
    setCurrentTeamId: (id: string | null) => void;

    // Board Features / Facilitator Controls
    isContentBlur: boolean;
    setIsContentBlur: (blur: boolean) => void;

    hideCards: boolean;
    setHideCards: (hide: boolean) => void;

    disableVoting: boolean;
    setDisableVoting: (disable: boolean) => void;

    hideVoteCount: boolean;
    setHideVoteCount: (hide: boolean) => void;

    maxVotesPerUser: number;
    setMaxVotesPerUser: (votes: number) => void;

    maxVotesScope: 'board' | 'column';
    setMaxVotesScope: (scope: 'board' | 'column') => void;

    featureFlags: {
        gifs: boolean;
        reactions: boolean;
        comments: boolean;
        password: boolean;
    };
    setFeatureFlag: (feature: 'gifs' | 'reactions' | 'comments' | 'password', enabled: boolean) => void;

    language: 'tr' | 'en';
    setLanguage: (lang: 'tr' | 'en') => void;

    currentUser: any | null;
    setCurrentUser: (user: any | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentTeamId: null,
    setCurrentTeamId: (id) => set({ currentTeamId: id }),

    isContentBlur: false,
    setIsContentBlur: (blur) => set({ isContentBlur: blur }),

    hideCards: false,
    setHideCards: (hide) => set({ hideCards: hide }),

    disableVoting: false,
    setDisableVoting: (disable) => set({ disableVoting: disable }),

    hideVoteCount: false,
    setHideVoteCount: (hide) => set({ hideVoteCount: hide }),

    maxVotesPerUser: 6,
    setMaxVotesPerUser: (votes) => set({ maxVotesPerUser: votes }),

    maxVotesScope: 'board',
    setMaxVotesScope: (scope) => set({ maxVotesScope: scope }),

    featureFlags: {
        gifs: false,
        reactions: false,
        comments: false,
        password: false
    },
    setFeatureFlag: (feature, enabled) => set((state) => ({
        featureFlags: { ...state.featureFlags, [feature]: enabled }
    })),

    language: 'tr',
    setLanguage: (lang) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('retro-language', lang);
        }
        set({ language: lang });
    },

    currentUser: null,
    setCurrentUser: (user) => set({ currentUser: user }),
}));

// Initialize language logic moved to components to avoid hydration mismatch
