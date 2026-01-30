import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search, ArrowUpDown, Eye, EyeOff, Timer, MoreHorizontal,
    Settings,
    Plus,
    Columns,
    Smile,
    PartyPopper,
    Rocket,
    Lightbulb,
    Star,
    Hand,
    Sparkles,
    ChevronDown
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { BoardSettingsSidebar } from "./board-settings-sidebar";
import { TimerWidget } from "./timer-widget";
import { dataService } from "@/services";

interface BoardToolbarProps {
    onAddCard: () => void;
    onAddColumn: () => void;
    onSearch: (query: string) => void;
    onSort: (type: 'order' | 'votes' | 'date') => void;
    boardTitle: string;
    onUpdateBoardTitle: (newTitle: string) => void;
    onDeleteBoard: () => void;
    boardId: string;
    onInvite?: () => void;
    members?: any[]; // Ideally User type
    activeUserFilter?: string | null;
    onMemberClick?: (userId: string) => void;
    currentUser?: any; // Ideally User type
}

export function BoardToolbar({ onAddCard, onAddColumn, onSearch, onSort, boardTitle, onUpdateBoardTitle, onDeleteBoard, boardId, onInvite, members, activeUserFilter, onMemberClick, currentUser }: BoardToolbarProps) {
    const { isContentBlur, setIsContentBlur } = useAppStore();
    const { t } = useTranslation();
    const [titleInput, setTitleInput] = useState(boardTitle);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTimerOpen, setIsTimerOpen] = useState(false);

    useEffect(() => {
        setTitleInput(boardTitle);
    }, [boardTitle]);

    // Sort members: Current User first, then Active Filter User, then others
    const sortedMembers = members ? [...members].sort((a, b) => {
        // 1. Current User always top
        if (currentUser && a.id === currentUser.id) return -1;
        if (currentUser && b.id === currentUser.id) return 1;

        // 2. Active Filter User second (so they become visible if selected from dropdown)
        if (activeUserFilter) {
            if (a.id === activeUserFilter) return -1;
            if (b.id === activeUserFilter) return 1;
        }

        return 0;
    }) : [];

    const handleTitleSubmit = () => {
        setIsEditingTitle(false);
        if (titleInput !== boardTitle) {
            onUpdateBoardTitle(titleInput);
        }
    };

    const triggerReaction = async (emoji: string) => {
        let type: any = 'celebrate';
        switch (emoji) {
            case '🔥': type = 'fire'; break;
            case '❤️': type = 'love'; break;
            case '🎉': type = 'celebrate'; break;
            case '👍': type = 'thumbsup'; break;
            case '👏': type = 'applause'; break;
            case '🚀': type = 'rocket'; break;
            case '💡': type = 'bulb'; break;
            case '⭐': type = 'star'; break;
            case '💎': type = 'gem'; break;
        }

        // Trigger local visual effect immediately
        // We need to import triggerVisualReaction or just dispatch event for it?
        // Actually reactions.ts exports broadcastReaction but here we use dataService.
        // Let's use the event listener in BoardPage to handle visual.
        // BoardPage likely listens to 'retro-reaction'.

        const user = await dataService.getCurrentUser();
        if (user && boardId) {
            const reactionId = crypto.randomUUID();

            let payload = emoji;
            // Provide sender name for GIFs
            if (emoji.startsWith('GIF|')) {
                const name = user.full_name || user.email?.split('@')[0] || 'Anonymous';
                payload = `${emoji}|${name}`;
            }

            // Dispatch local event
            window.dispatchEvent(new CustomEvent('retro-reaction', { detail: { emoji: payload, type, id: reactionId } }));

            // Broadcast
            await dataService.broadcastReaction(boardId, payload, user.id, reactionId);
        }
    };

    return (
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 px-2 sm:px-4 flex items-center justify-between sticky top-0 z-10 shadow-sm dark:shadow-none overflow-x-auto no-scrollbar gap-4">
            {/* Left: Title */}
            <div className="flex items-center gap-4">
                {isEditingTitle ? (
                    <input
                        className="font-bold text-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-zinc-900 border border-blue-500 rounded px-2 py-1 outline-none"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onBlur={handleTitleSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                        autoFocus
                    />
                ) : (
                    <h1
                        className="font-bold text-xl text-slate-800 dark:text-slate-100 cursor-text hover:bg-slate-100 dark:hover:bg-zinc-800 rounded px-2 py-1 transition-colors"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        {boardTitle}
                    </h1>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <Input
                        placeholder={t('board.search_placeholder')}
                        className="pl-9 h-9 w-[200px] bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-zinc-800 transition-all dark:text-slate-200 dark:placeholder:text-slate-500"
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>

                {/* Sort - Desktop Only */}
                <div className="hidden md:flex items-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-zinc-900 overflow-hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-slate-600 dark:text-slate-400 rounded-none border-r border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-zinc-800"
                        onClick={() => onSort('order')}
                        title={t('board.sort_order')}
                    >
                        <Columns className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-slate-600 dark:text-slate-400 rounded-none hover:bg-white dark:hover:bg-zinc-800"
                        onClick={() => onSort('votes')}
                        title={t('board.sort_votes')}
                    >
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </div>

                {/* Blur Toggle - Desktop Only */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-9 w-9 hidden md:flex", isContentBlur ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-slate-400 dark:text-slate-500 dark:hover:text-slate-300")}
                    onClick={() => setIsContentBlur(!isContentBlur)}
                    title={isContentBlur ? "Reveal Content" : "Blur Content"}
                >
                    {isContentBlur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>

                {/* Reactions - Desktop Only */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 dark:text-slate-500 hover:text-yellow-500 dark:hover:text-yellow-400 hidden md:flex">
                            <Smile className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <div className="flex gap-2 p-2">
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('🔥')} className="text-xl">🔥</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('❤️')} className="text-xl">❤️</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('🎉')} className="text-xl">🎉</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('👍')} className="text-xl">👍</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('👏')} className="text-xl">👏</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('🚀')} className="text-xl">🚀</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('💡')} className="text-xl">💡</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('⭐')} className="text-xl">⭐</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('💎')} className="text-xl">💎</Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-9 text-slate-600 dark:text-slate-400 hidden lg:flex gap-2", isTimerOpen && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400")}
                    onClick={() => setIsTimerOpen(!isTimerOpen)}
                >
                    <Timer className="h-4 w-4" />
                    <span className="text-xs font-medium">{t('board.timer')}</span>
                </Button>

                {/* Invite & Members */}
                <div className="flex items-center gap-1 mx-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                    {/* Desktop Invite Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:text-blue-700 dark:hover:text-blue-300 px-2 hidden md:flex"
                        onClick={onInvite}
                    >
                        <span className="text-xs font-semibold">+ {t('board.invite')}</span>
                    </Button>

                    {/* Mobile: Users Button Triggering Dropdown with everyone */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-colors",
                                    activeUserFilter
                                        ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200"
                                        : "bg-slate-100 dark:bg-zinc-800 border-white dark:border-zinc-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                                )}>
                                    {sortedMembers.length}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="dark:bg-zinc-950 dark:border-slate-800">
                                <div className="max-h-48 overflow-y-auto p-1">
                                    {sortedMembers.map((user: any) => {
                                        const isActive = activeUserFilter === user.id;
                                        return (
                                            <DropdownMenuItem
                                                key={user.id}
                                                onClick={() => onMemberClick?.(user.id)}
                                                className={cn(
                                                    "flex items-center gap-2 cursor-pointer",
                                                    isActive && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                )}
                                            >
                                                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden text-[10px] uppercase font-bold text-slate-500">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} className="h-full w-full object-cover" />
                                                    ) : (
                                                        (user.full_name || user.email).substring(0, 2)
                                                    )}
                                                </div>
                                                <span className="text-sm truncate max-w-[150px]">{user.full_name || user.email}</span>
                                                {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Desktop: Avatars + Overflow */}
                    <div className="hidden md:flex -space-x-2 pl-2 items-center py-1">
                        {sortedMembers.slice(0, 5).map((user: any) => {
                            const isActive = activeUserFilter === user.id;
                            const isMe = currentUser && user.id === currentUser.id;
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => onMemberClick?.(user.id)}
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 transition-all focus:outline-none relative group",
                                        isActive
                                            ? "border-blue-500 ring-2 ring-blue-300 z-30 scale-110"
                                            : "border-white dark:border-zinc-900 hover:scale-105 hover:z-20 bg-slate-200 dark:bg-zinc-800"
                                    )}
                                    title={isMe ? `${user.full_name} (Me)` : `Filter by ${user.full_name || user.email}`}
                                >
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className={cn("text-[10px] font-bold", isActive ? "text-blue-600 bg-white h-full w-full flex items-center justify-center" : "text-slate-500 dark:text-slate-400")}>
                                            {user.full_name?.substring(0, 2).toUpperCase() || user.email.substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                    {isMe && (
                                        <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-white"></span>
                                    )}
                                </button>
                            );
                        })}
                        {sortedMembers.length > 5 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] text-slate-500 dark:text-slate-400 font-medium shrink-0 z-10 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                                        +{sortedMembers.length - 5}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="dark:bg-zinc-950 dark:border-slate-800">
                                    <div className="max-h-48 overflow-y-auto p-1">
                                        {sortedMembers.slice(5).map((user: any) => (
                                            <DropdownMenuItem
                                                key={user.id}
                                                onClick={() => onMemberClick?.(user.id)}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden text-[10px] uppercase font-bold text-slate-500">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} className="h-full w-full object-cover" />
                                                    ) : (
                                                        (user.full_name || user.email).substring(0, 2)
                                                    )}
                                                </div>
                                                <span className="text-sm truncate max-w-[150px]">{user.full_name || user.email}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Add Button */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-3 ml-2 shadow-sm">
                            <Plus className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">{t('board.add_button')}</span>
                            <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 dark:bg-zinc-950 dark:border-slate-800">
                        <DropdownMenuItem onClick={onAddCard} className="cursor-pointer dark:focus:bg-zinc-900">
                            <Plus className="mr-2 h-4 w-4" />
                            <span>{t('board.add_card')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onAddColumn} className="cursor-pointer dark:focus:bg-zinc-900">
                            <Columns className="mr-2 h-4 w-4" />
                            <span>{t('board.add_column')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Settings Button - Desktop Only */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 ml-1 hidden md:flex"
                    onClick={() => setIsSettingsOpen(true)}
                >
                    <Settings className="h-4 w-4" />
                </Button>

                {/* Mobile Menu (Consolidated Actions) */}
                <div className="md:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 dark:text-slate-400">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:bg-zinc-950 dark:border-slate-800 min-w-[200px]">
                            {/* Invite Mobile */}
                            <DropdownMenuItem onClick={onInvite} className="gap-2 cursor-pointer">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                                    <Plus className="h-3 w-3" />
                                </span>
                                <span>{t('board.invite')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {/* Sort Options */}
                            <DropdownMenuItem onClick={() => onSort('order')} className="gap-2 cursor-pointer">
                                <Columns className="h-4 w-4" />
                                <span>{t('board.sort_order')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSort('votes')} className="gap-2 cursor-pointer">
                                <ArrowUpDown className="h-4 w-4" />
                                <span>{t('board.sort_votes')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {/* Reactions Submenu */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex items-center gap-2">
                                    <Smile className="h-4 w-4" />
                                    <span>{t('board.reactions')}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="dark:bg-zinc-950 dark:border-slate-800 p-2 min-w-[200px]">
                                        <div className="grid grid-cols-5 gap-2 mb-2">
                                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('🔥')} className="h-8 w-8 text-lg">🔥</Button>
                                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('❤️')} className="h-8 w-8 text-lg">❤️</Button>
                                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('👍')} className="h-8 w-8 text-lg">👍</Button>
                                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('👏')} className="h-8 w-8 text-lg">👏</Button>
                                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('🚀')} className="h-8 w-8 text-lg">🚀</Button>
                                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('💡')} className="h-8 w-8 text-lg">💡</Button>
                                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('⭐')} className="h-8 w-8 text-lg">⭐</Button>
                                        </div>

                                        <DropdownMenuSeparator />

                                        <div className="p-1">
                                            <p className="text-xs text-muted-foreground mb-2 px-1">{t('board.gifs') || "GIFs"}</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODFjZjI2YjExYjRkYjJkYjJkYjJkYjJkYjJkYjJkYjJkYiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/3o7TKSjRrfIPjeiVyM/giphy.gif',
                                                    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODFjZjI2YjExYjRkYjJkYjJkYjJkYjJkYjJkYjJkYjJkYiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/l0HlHFRbmaXWpnsdi/giphy.gif',
                                                    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODFjZjI2YjExYjRkYjJkYjJkYjJkYjJkYjJkYjJkYjJkYiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/3o6UB3VhArvomJHtdK/giphy.gif',
                                                    'https://media.giphy.com/media/26tOZ42Mg6pbTUPvy/giphy.gif',
                                                    'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
                                                    'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif'].map((gif, i) => (
                                                        <button
                                                            key={i}
                                                            className="w-full aspect-video rounded-md overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all bg-black/10 relative group"
                                                            onClick={() => triggerReaction(`GIF|${gif}`)}
                                                        >
                                                            <img src={gif} className="w-full h-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            {/* Settings */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="gap-2 cursor-pointer">
                                <Settings className="h-4 w-4" />
                                <span>{t('board.settings')}</span>
                            </DropdownMenuItem>

                            {/* Timer */}
                            <DropdownMenuItem onClick={() => setIsTimerOpen(!isTimerOpen)} className="gap-2 cursor-pointer">
                                <Timer className="h-4 w-4" />
                                <span>{t('board.timer')}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <BoardSettingsSidebar isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} boardId={boardId} />
            <TimerWidget open={isTimerOpen} onOpenChange={setIsTimerOpen} />
        </div >
    );
}
