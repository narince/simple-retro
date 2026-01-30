import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, MoreVertical, Trash2, Edit2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardCard } from "./board-card";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card } from "@/services/types";
import { useTranslation } from "@/lib/i18n";
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface ColumnProps {
    id: string;
    title: string;
    color: string;
    cards: Card[];
    onAddCard: (id: string, content: string, isAnonymous?: boolean) => void;
    onUpdateTitle?: (id: string, newTitle: string) => void;
    onDeleteColumn?: () => void;
    onUpdateColor?: (color: string) => void;
    onDeleteCard: (cardId: string) => void;
    canVote?: boolean;
    onVote?: (cardId: string) => void;
    currentUserId?: string;
    isAdmin?: boolean;
}

const COLUMN_COLORS = [
    { name: "Gray", class: "bg-slate-500" },
    { name: "Blue", class: "bg-blue-600" },
    { name: "Green", class: "bg-teal-600" },
    { name: "Red", class: "bg-rose-600" },
    { name: "Purple", class: "bg-violet-600" },
    { name: "Yellow", class: "bg-yellow-500" },
];

export function BoardColumn({ id, title, color, cards, onAddCard, onUpdateTitle, onDeleteColumn, onUpdateColor, onDeleteCard, canVote = true, onVote, currentUserId, isAdmin }: ColumnProps) {
    const { setNodeRef } = useDroppable({ id });
    const { t } = useTranslation();
    const [animateRef] = useAutoAnimate();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(title);

    const setRefs = useCallback((node: HTMLElement | null) => {
        setNodeRef(node);
        animateRef(node);
    }, [setNodeRef, animateRef]);

    // Inline Add State
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardContent, setNewCardContent] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const addInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isAddingCard && addInputRef.current) {
            addInputRef.current.focus();
        }
    }, [isAddingCard]);

    const handleTitleSubmit = () => {
        setIsEditingTitle(false);
        if (titleInput !== title && onUpdateTitle) {
            onUpdateTitle(id, titleInput);
        }
    };

    const handleAddSubmit = () => {
        if (newCardContent.trim()) {
            onAddCard(id, newCardContent, isAnonymous);
            setNewCardContent("");
            setIsAddingCard(true);
            if (addInputRef.current) addInputRef.current.focus();
        } else {
            setIsAddingCard(false);
            setIsAnonymous(false); // Reset
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddSubmit();
        }
        if (e.key === 'Escape') {
            setIsAddingCard(false);
        }
    };

    // Helper to translate standard column titles dynamically
    const displayTitle = (() => {
        const standardKeys = [
            'templates.column.went_well',
            'templates.column.to_improve',
            'templates.column.action_items',
            'templates.column.start',
            'templates.column.stop',
            'templates.column.continue',
            'templates.column.mad',
            'templates.column.sad',
            'templates.column.glad'
        ] as const;

        // Check if current title matches any standard translation in ANY language (EN or TR)
        // This is a bit expensive but robust. 
        // Better: Check if it matches the *English* or *Turkish* standard strings specifically.

        // Simple approach: Map known EN/TR strings to the key
        const reverseMap: Record<string, string> = {};
        standardKeys.forEach(k => {
            // We need access to all translations, but `t` only gives current or specific if we had the object.
            // We can import translations object from i18n if we export it, or hardcode here.
            // Let's rely on the fact that we might have "Went Well" or "Neler İyi Gitti".
        });

        // Actually, cleaner way: 
        // If the title matches t(key) for any key in current language, it's already good.
        // If it matches t(key) for the *other* language, we should swap it.

        // Let's try a simple heuristic for the specific requested template "Went Well - To Improve"
        // Went Well - To Improve
        if (title === 'Went Well' || title === 'Neler İyi Gitti?') return t('templates.column.went_well');
        if (title === 'To Improve' || title === 'Neleri Geliştirmeliyiz?') return t('templates.column.to_improve');
        if (title === 'Action Items' || title === 'Alınacak Aksiyonlar') return t('templates.column.action_items');

        // Start - Stop - Continue
        if (title === 'Start' || title === 'Başla') return t('templates.column.start');
        if (title === 'Stop' || title === 'Dur') return t('templates.column.stop');
        if (title === 'Continue' || title === 'Devam Et') return t('templates.column.continue');

        // Mad - Sad - Glad
        if (title === 'Mad' || title === 'Kızgın') return t('templates.column.mad');
        if (title === 'Sad' || title === 'Üzgün') return t('templates.column.sad');
        if (title === 'Glad' || title === 'Mutlu') return t('templates.column.glad');

        // Lean Coffee
        if (title === 'To Discuss' || title === 'Tartışılacak') return t('templates.column.to_discuss');
        if (title === 'Discussing' || title === 'Tartışılıyor') return t('templates.column.discussing');
        if (title === 'Done' || title === 'Tamamlandı') return t('templates.column.done');

        return title;
    })();

    return (
    return (
        <div className="flex flex-col h-full min-h-[500px] w-[85vw] sm:w-[350px] xl:w-[400px] bg-transparent shrink-0">
            {/* Header: Minimalist with colored dot & Editable Title */}
            <div className="flex items-center gap-2 mb-2 px-1 group justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                        className={cn("w-3 h-3 rounded-full shrink-0", !color.startsWith('#') && color)}
                        style={color.startsWith('#') ? { backgroundColor: color } : undefined}
                    ></div>

                    {isEditingTitle ? (
                        <input
                            className="font-bold text-slate-700 dark:text-slate-200 text-lg bg-white dark:bg-zinc-900 border border-blue-500 rounded px-1 w-full outline-none"
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                            autoFocus
                        />
                    ) : (
                        <h3
                            className="font-bold text-slate-700 dark:text-slate-200 text-lg cursor-text hover:bg-slate-100 dark:hover:bg-zinc-800 rounded px-1 truncate"
                            onClick={() => setIsEditingTitle(true)}
                        >
                            {displayTitle}
                        </h3>
                    )}
                </div>

                {/* Column Actions Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                            <Edit2 className="mr-2 h-4 w-4" /> {t('board.rename')}
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Palette className="mr-2 h-4 w-4" /> {t('board.color')}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="p-2 grid grid-cols-3 gap-2 min-w-[100px] -ml-1">
                                {COLUMN_COLORS.map(c => (
                                    <div
                                        key={c.name}
                                        className={cn("w-6 h-6 rounded-full cursor-pointer border-2 border-transparent hover:scale-110 transition-transform", c.class)}
                                        onClick={() => onUpdateColor?.(c.class)}
                                        title={t(`colors.${c.name.toLowerCase()}` as any)}
                                    />
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDeleteColumn}>
                            <Trash2 className="mr-2 h-4 w-4" /> {t('board.delete')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Inline Add Button Area */}
            <div className="mb-2 px-1">
                {!isAddingCard ? (
                    <div
                        className="flex items-center justify-center bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 cursor-pointer py-2 rounded-md transition-colors w-full group"
                        onClick={() => setIsAddingCard(true)}
                    >
                        <Plus className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                    </div>
                ) : (
                    <div
                        className="bg-white dark:bg-zinc-900 p-1 rounded-sm shadow-sm border border-blue-200 dark:border-blue-900/50"
                        // use onBlur solely on container doesn't work well because clicking children blurs parent.
                        // Instead, we can use a click-outside listener if we want handled at global level, 
                        // BUT for simplicity, we can check if the new active element is inside this container.
                        onBlur={(e) => {
                            // Check if the new focus is still within this container
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                if (!newCardContent) {
                                    setIsAddingCard(false);
                                    setIsAnonymous(false);
                                }
                            }
                        }}
                    >
                        <textarea
                            ref={addInputRef}
                            className="w-full text-sm p-2 rounded-sm border-0 focus:ring-0 min-h-[60px] text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-transparent resize-none leading-snug focus-visible:outline-none"
                            placeholder={t('board.card_placeholder')}
                            value={newCardContent}
                            onChange={(e) => setNewCardContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus // Ensure it grabs focus so onBlur works
                        />
                        <div className="flex justify-between items-center gap-2 mt-1 border-t pt-1 border-slate-100 dark:border-slate-800">
                            <button
                                type="button" // Prevent form submission behaviors if any
                                className={cn(
                                    "flex items-center gap-1.5 cursor-pointer px-1.5 py-0.5 rounded transition-colors select-none",
                                    isAnonymous ? "bg-slate-800 dark:bg-slate-700 text-white" : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                )}
                                onMouseDown={(e) => e.preventDefault()} // Prevent stealing focus from textarea which would trigger blur
                                onClick={() => setIsAnonymous(!isAnonymous)}
                                title="Post Anonymously"
                            >
                                <div className={cn("relative flex items-center justify-center transition-all", isAnonymous ? "scale-110" : "scale-100")}>
                                    {/* Ghost Icon */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={cn("mr-1.5 transition-colors", isAnonymous ? "text-white" : "text-slate-400 dark:text-slate-500")}
                                    >
                                        <path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
                                    </svg>
                                </div>
                                <span className={cn("text-[11px] font-medium transition-colors", isAnonymous ? "text-white" : "text-slate-500 dark:text-slate-400")}>
                                    {isAnonymous ? t('board.anonymous') : t('board.post_anonymously')}
                                </span>
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">{t('board.enter_to_add')}</span>
                                <Button
                                    size="sm"
                                    className="h-6 text-[10px] px-2"
                                    onClick={handleAddSubmit}
                                    onMouseDown={(e) => e.preventDefault()} // Keep focus on input/container
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cards Area */}
            <div
                ref={setRefs}
                className="flex-1 p-1 space-y-2 bg-transparent min-h-[100px]"
            >
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <BoardCard
                            key={card.id}
                            id={card.id}
                            content={card.content}
                            votes={card.votes}
                            comments={card.comments}
                            color={color} // Pass column color to card (or card's own color logic?)
                            votedUserIds={card.voted_user_ids}
                            onDelete={() => onDeleteCard(card.id)}
                            canVote={canVote}
                            onVote={() => onVote?.(card.id)}
                            authorName={card.author_full_name}
                            authorAvatar={card.author_avatar_url}
                            isAnonymous={card.isAnonymous}
                            authorId={card.author_id}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
