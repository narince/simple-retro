'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dataService } from '@/services';
import { Board, User } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MoreVertical, Edit2, Trash2, Search, Clock, Share2, Copy, LayoutGrid, List } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BoardDialog } from '@/components/dashboard/board-dialog';
import { ConfirmationDialog } from '@/components/dashboard/confirmation-dialog';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function DashboardPage() {
    const { t } = useTranslation();
    const [parent] = useAutoAnimate();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [showArchived, setShowArchived] = useState(false);
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc'>('date-desc');
    const [isBoardsHidden, setIsBoardsHidden] = useState(false);

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

    // Action States
    const [cloningId, setCloningId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // ... (keep useEffect and handlers same) ...

    useEffect(() => {
        const load = async () => {
            const currentUser = await dataService.getCurrentUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);
            const allBoards = await dataService.getBoards('any');
            // STRICT FILTERING
            const myBoards = allBoards.filter(b => {
                const isOwner = b.owner_id === currentUser.id || b.created_by === currentUser.id;
                const isMember = b.allowed_user_ids?.includes(currentUser.id);
                return isOwner || isMember;
            });

            // Sort by date desc
            myBoards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setBoards(myBoards);
            setLoading(false);
        };
        load();
    }, [router]);

    const handleCreateBoard = async (title: string, options?: { maxVotes: number; templateId: string }) => {
        if (!user) return;
        setLoading(true);

        let initialColumns;
        if (options?.templateId) {
            // Updated to use translated strings for column titles so they persist in the correct language
            const TEMPLATES: Record<string, { title: string; color: string }[]> = {
                'start-stop-continue': [
                    { title: t('templates.column.start'), color: 'bg-teal-600' },
                    { title: t('templates.column.stop'), color: 'bg-rose-600' },
                    { title: t('templates.column.continue'), color: 'bg-violet-600' }
                ],
                'mad-sad-glad': [
                    { title: t('templates.column.mad'), color: 'bg-rose-600' },
                    { title: t('templates.column.sad'), color: 'bg-blue-600' },
                    { title: t('templates.column.glad'), color: 'bg-green-600' }
                ],
                'lean-coffee': [
                    { title: t('templates.column.to_discuss'), color: 'bg-slate-500' },
                    { title: t('templates.column.discussing'), color: 'bg-blue-600' },
                    { title: t('templates.column.done'), color: 'bg-green-600' }
                ],
                'went-well-to-improve': [
                    { title: t('templates.column.went_well'), color: 'bg-green-600' },
                    { title: t('templates.column.to_improve'), color: 'bg-rose-600' },
                    { title: t('templates.column.action_items'), color: 'bg-violet-600' }
                ]
            };
            initialColumns = TEMPLATES[options.templateId];
        }

        const newBoard = await dataService.createBoard(title, 'default-team', {
            initialColumns,
            maxVotes: options?.maxVotes
        });
        router.push(`/board/${newBoard.id}`);
    };

    const handleClone = async (e: React.MouseEvent, boardAction: Board) => {
        e.stopPropagation();
        if (cloningId) return;
        setCloningId(boardAction.id);

        try {
            // Smart Naming Logic
            const currentSuffix = t('dashboard.clone_suffix'); // "Clone" or "Klon"
            // Known suffixes in all supported languages to strip
            const knownSuffixes = ['Clone', 'Klon'];

            let rootTitle = boardAction.title;

            // Attempt to strip any known suffix: "Title (Suffix) 123" -> "Title"
            for (const suffix of knownSuffixes) {
                const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Regex to match " (Suffix)" at end, optionally followed by space and numbers
                // e.g. "Foo (Clone)", "Foo (Clone) 2", "Foo (Klon) 3"
                const suffixRegex = new RegExp(` \\(${escapedSuffix}\\)(?: (\\d+))?$`);

                if (suffixRegex.test(rootTitle)) {
                    rootTitle = rootTitle.replace(suffixRegex, '');
                    break; // Found and stripped, stop looking
                }
            }

            // Find all titles starting with rootTitle to determine next number
            const existingTitles = boards.map(b => b.title);
            let nextNum = 2;

            // 1. Try "Root (CurrentSuffix)"
            let candidate = `${rootTitle} (${currentSuffix})`;

            // Logic:
            // "tst" -> "tst (Clone)"
            // "tst (Clone)" -> "tst (Clone) 2"
            // "tst (Clone)" [switch to TR] -> "tst (Klon) 2" (if tst (Klon) exists?)
            // Actually, we want to maintain unique names.

            // If the candidate exists, or if check for "Root (Suffix) N" matches

            // We need to check if ANY variation exists to increment number correctly?
            // User requirement: "tst (Clone)" -> "tst (Clone) 2" (if same lang)
            // "tst (Clone)" -> "tst (Klon)" (if lang changed? No, "tst (Clone)" is just a string now).
            // Wait, if I clone "tst (Clone)", and I am in Turkish:
            // root = "tst".
            // candidate = "tst (Klon)".
            // If "tst (Klon)" does NOT exist, we create "tst (Klon)".
            // Result: "tst (Clone)" (original) AND "tst (Klon)" (new). 
            // This satisfies "Same name cannot exist". They are different.

            // But if "tst (Klon)" ALSO exists:
            // We need "tst (Klon) 2".

            if (existingTitles.includes(candidate)) {
                // Check for sequence 2, 3, 4...
                while (existingTitles.includes(`${rootTitle} (${currentSuffix}) ${nextNum}`)) {
                    nextNum++;
                }
                candidate = `${rootTitle} (${currentSuffix}) ${nextNum}`;
            }

            const newBoard = await dataService.cloneBoard(boardAction.id, candidate);
            setBoards(prev => [newBoard, ...prev]);
        } catch (error) {
            console.error("Failed to clone board", error);
        } finally {
            setCloningId(null);
        }
    };

    const handleShare = (e: React.MouseEvent, boardId: string) => {
        e.stopPropagation();
        const url = `${window.location.origin}/board/${boardId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedId(boardId);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const confirmDeleteBoard = async () => {
        if (selectedBoard) {
            await dataService.deleteBoard(selectedBoard.id);
            setBoards(prev => prev.filter(b => b.id !== selectedBoard.id));
            setSelectedBoard(null);
        }
    };

    const handleRenameBoard = async (title: string) => {
        if (selectedBoard) {
            const updated = await dataService.updateBoard(selectedBoard.id, { title });
            if (updated) {
                setBoards(prev => prev.map(b => b.id === selectedBoard.id ? updated : b));
            }
            setSelectedBoard(null);
        }
    };

    const openRenameDialog = (e: React.MouseEvent, board: Board) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedBoard(board);
        setIsRenameOpen(true);
    };

    const openDeleteDialog = (e: React.MouseEvent, board: Board) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedBoard(board);
        setIsDeleteOpen(true);
    };

    // Filter Boards
    const filteredBoards = boards
        .filter(b => {
            // Search Filter
            if (!b.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            // Archive Filter (Show active only by default, unless showArchived is true)
            // Assuming board has is_archived property. If undefined, assume false.
            const isArchived = !!b.is_archived;
            if (!showArchived && isArchived) return false;
            // If showArchived is true, we show EVERYTHING (both active and archived)? 
            // Or typically "Show Archived" implies toggling view?
            // Based on UI "YES/NO", it implies filter inclusion.
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
        });

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="container mx-auto py-8 px-6 max-w-7xl min-h-screen">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('dashboard.title')}</h1>
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700">
                        {filteredBoards.length} {t('dashboard.boards')}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder={t('dashboard.filter_placeholder')}
                            className="pl-9 h-10 w-[240px] bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 rounded-full shadow-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4 ml-1">
                        <button
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => setSortBy(prev => prev === 'date-desc' ? 'date-asc' : 'date-desc')}
                        >
                            <Clock className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('dashboard.sort_date')}</span>
                            <span className="text-xs opacity-50 ml-1">{sortBy === 'date-desc' ? '↓' : '↑'}</span>
                        </button>

                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 rounded-md transition-all", view === 'grid' ? 'bg-white dark:bg-zinc-950 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')}
                                onClick={() => setView('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 rounded-md transition-all", view === 'list' ? 'bg-white dark:bg-zinc-950 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')}
                                onClick={() => setView('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowArchived(!showArchived)}
                            className={cn("h-9 rounded-full border-slate-200 dark:border-slate-800 transition-colors", showArchived ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" : "text-slate-500 dark:text-slate-400")}
                        >
                            {showArchived ? t('dashboard.hide_archived') : t('dashboard.show_archived')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Board Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-4">
                        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.public_boards')}</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        onClick={() => setIsBoardsHidden(!isBoardsHidden)}
                    >
                        {isBoardsHidden ? t('dashboard.show_boards') : t('dashboard.hide_boards')}
                    </Button>
                </div>

                {!isBoardsHidden && (
                    <div ref={parent} className={cn("grid gap-6", view === 'grid' ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1")}>
                        {/* Add Board Card */}
                        <div
                            onClick={() => setIsCreateOpen(true)}
                            className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg dark:hover:shadow-blue-900/10 cursor-pointer h-[260px] transition-all group"
                        >
                            <div className="h-16 w-16 bg-white dark:bg-zinc-800 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:text-blue-600 transition-all border border-slate-100 dark:border-slate-700">
                                <Plus className="h-8 w-8 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors" />
                            </div>
                            <span className="font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t('dashboard.add_board')}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center px-4">{t('dashboard.add_board_desc')}</span>

                            {/* Empty State Arrow guide */}
                            {boards.length === 0 && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-6 flex items-center gap-2 w-max pointer-events-none hidden xl:flex z-10">
                                    <style jsx global>{`
                                        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
                                    `}</style>
                                    <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-rose-600 dark:text-rose-400 -rotate-12">
                                        <path d="M110 10 C 80 10, 60 50, 30 40 C 10 35, 20 15, 5 25 L 15 30 M 5 25 L 15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
                                    </svg>
                                    <span className="text-2xl text-rose-600 dark:text-rose-400 -rotate-6 transform origin-left relative -top-6 left-2 font-hand" style={{ fontFamily: '"Caveat", cursive' }}>
                                        {t('dashboard.create_first_board')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Board Cards */}
                        {filteredBoards.map((board) => (
                            <div
                                key={board.id}
                                className={cn(
                                    "bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-black/40 transition-all flex flex-col cursor-pointer group relative overflow-hidden",
                                    view === 'grid' ? "h-[260px]" : "h-auto flex-row items-center p-4 min-h-[80px]"
                                )}
                                onClick={() => router.push(`/board/${board.id}`)}
                            >
                                {/* Gradient Top Border */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                {view === 'grid' ? (
                                    <>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={board.title}>
                                                    {board.title}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 mb-6">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(board.created_at).toLocaleDateString()}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                <span>{board.column_colors?.length || 3} {t('settings.column')}</span>
                                            </div>

                                            {/* Mini Columns Preview */}
                                            <div className="flex gap-2 h-20 items-end mt-auto px-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                {board.column_colors && board.column_colors.length > 0 ? (
                                                    board.column_colors.map((color, i) => (
                                                        <div key={i} className={cn("flex-1 rounded-t-md shadow-sm min-w-[8px]", color)} style={{ height: `${Math.max(30, 85 - (i * 12))}%` }}></div>
                                                    ))
                                                ) : (
                                                    <>
                                                        <div className="flex-1 bg-teal-500 h-full rounded-t-md shadow-sm"></div>
                                                        <div className="flex-1 bg-rose-500 h-[70%] rounded-t-md shadow-sm"></div>
                                                        <div className="flex-1 bg-violet-500 h-[85%] rounded-t-md shadow-sm"></div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="border-t border-slate-100 dark:border-slate-800 flex items-center bg-slate-50 dark:bg-zinc-800/50 h-10 divide-x divide-slate-100 dark:divide-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-800 h-full transition-colors uppercase tracking-wider"
                                                onClick={(e) => handleShare(e, board.id)}
                                            >
                                                {copiedId === board.id ? (
                                                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><Share2 className="h-3 w-3" /> {t('dashboard.copied')}</span>
                                                ) : (
                                                    <><Share2 className="h-3 w-3" /> {t('dashboard.share')}</>
                                                )}
                                            </button>
                                            <button
                                                className="flex-1 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-800 h-full transition-colors uppercase tracking-wider"
                                                onClick={(e) => handleClone(e, board)}
                                                disabled={cloningId === board.id}
                                            >
                                                {cloningId === board.id ? (
                                                    <span className="text-blue-600 dark:text-blue-400 animate-pulse">{t('dashboard.cloning')}</span>
                                                ) : (
                                                    <><Copy className="h-3 w-3" /> {t('dashboard.clone')}</>
                                                )}
                                            </button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => openRenameDialog(e, board)}>
                                                        <Edit2 className="mr-2 h-4 w-4" /> {t('dashboard.rename')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={(e) => openDeleteDialog(e, board)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> {t('dashboard.delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </>
                                ) : (
                                    // List View
                                    <>
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <LayoutGrid className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{board.title}</h3>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(board.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{board.column_colors?.length || 3} {t('settings.column')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={(e) => handleShare(e, board.id)}>
                                                <Share2 className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={(e) => handleClone(e, board)}>
                                                <Copy className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                                        <MoreVertical className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => openRenameDialog(e, board)}>
                                                        <Edit2 className="mr-2 h-4 w-4" /> {t('dashboard.rename')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={(e) => openDeleteDialog(e, board)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> {t('dashboard.delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BoardDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSubmit={handleCreateBoard}
                mode="create"
            />

            <BoardDialog
                open={isRenameOpen}
                onOpenChange={setIsRenameOpen}
                onSubmit={handleRenameBoard}
                initialTitle={selectedBoard?.title}
                mode="rename"
            />

            <ConfirmationDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                title={t('dialog.delete_board.title')}
                description={t('dialog.delete_board.description')}
                onConfirm={confirmDeleteBoard}
                variant="destructive"
                confirmText={t('dialog.delete_board.submit')}
            />
        </div>
    );
}
