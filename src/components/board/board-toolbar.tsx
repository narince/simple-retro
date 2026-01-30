import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search, ArrowUpDown, Eye, EyeOff, Timer, ChevronDown,
    Settings, Columns, Plus, Smile, Trash2, Cloud
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
} from "@/components/ui/dropdown-menu";
import { BoardSettingsSidebar } from "./board-settings-sidebar";
import { TimerWidget } from "./timer-widget";
import { dataService } from "@/services";
import { VozolIcon } from "@/components/icons/vozol-icon";

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

    // Sort members: Current User first, then others
    const sortedMembers = members ? [...members].sort((a, b) => {
        if (currentUser && a.id === currentUser.id) return -1;
        if (currentUser && b.id === currentUser.id) return 1;
        return 0;
    }) : [];

    const handleTitleSubmit = () => {
        setIsEditingTitle(false);
        if (titleInput !== boardTitle) {
            onUpdateBoardTitle(titleInput);
        }
    };

    const triggerReaction = async (emoji: string) => {
        // Visual effect logic would go here or be triggered via a global event/store
        // For now, just broadcast
        const user = await dataService.getCurrentUser();
        if (user && boardId) {
            const reactionId = crypto.randomUUID();
            // Dispatch local event first with ID
            window.dispatchEvent(new CustomEvent('retro-reaction', { detail: { emoji, id: reactionId } }));
            await dataService.broadcastReaction(boardId, emoji, user.id, reactionId);
        }
    };

    return (
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 px-4 flex items-center justify-between sticky top-0 z-10 shadow-sm dark:shadow-none">
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

                {/* Sort */}
                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-zinc-900 overflow-hidden">
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

                {/* Blur Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-9 w-9", isContentBlur ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-slate-400 dark:text-slate-500 dark:hover:text-slate-300")}
                    onClick={() => setIsContentBlur(!isContentBlur)}
                    title={isContentBlur ? "Reveal Content" : "Blur Content"}
                >
                    {isContentBlur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>

                {/* Reactions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 dark:text-slate-500 hover:text-yellow-500 dark:hover:text-yellow-400">
                            <Smile className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <div className="flex gap-2 p-2">
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('🔥')} className="text-xl">🔥</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('❤️')} className="text-xl">❤️</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('🎉')} className="text-xl">🎉</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('👍')} className="text-xl">👍</Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerReaction('vozol')} className="text-xl overflow-visible">
                                <VozolIcon className="h-10 w-auto drop-shadow-sm scale-[1.8] origin-center" />
                            </Button>
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
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:text-blue-700 dark:hover:text-blue-300 px-2"
                        onClick={onInvite}
                    >
                        <span className="text-xs font-semibold">+ {t('board.invite')}</span>
                    </Button>

                    {/* Member Avatars */}
                    <div className="flex -space-x-2 pl-2 items-center py-1">
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

                {/* Settings Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 ml-1"
                    onClick={() => setIsSettingsOpen(true)}
                >
                    <Settings className="h-4 w-4" />
                </Button>

                <BoardSettingsSidebar isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} boardId={boardId} />
                <TimerWidget open={isTimerOpen} onOpenChange={setIsTimerOpen} />
            </div>
        </div>
    );
}
