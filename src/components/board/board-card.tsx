import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Heart, MessageSquare, MoreVertical, Trash2, Edit2, Palette, Send, Ghost } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { dataService } from "@/services";
import { useTranslation } from "@/lib/i18n";
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

interface BoardCardProps {
    id: string;
    content: string;
    votes: number;
    comments: any[]; // Handle legacy strings and new Comment objects
    color?: string;
    votedUserIds?: string[];
    onDelete?: () => void;
    canVote?: boolean;
    onVote?: () => void;
    authorName?: string;
    authorAvatar?: string;
    isAnonymous?: boolean;
    authorId?: string;
    currentUserId?: string;
    isAdmin?: boolean;
}

const CARD_COLORS = [
    { name: "Green", class: "bg-teal-600" },
    { name: "Red", class: "bg-rose-600" },
    { name: "Purple", class: "bg-violet-600" },
    { name: "Blue", class: "bg-blue-600" },
    { name: "Yellow", class: "bg-yellow-500" },
];

export function BoardCard({ id, content: initialContent, votes: initialVotes, comments: initialComments, color: initialColor, votedUserIds = [], onDelete, canVote = true, onVote, authorName, authorAvatar, isAnonymous, authorId, currentUserId, isAdmin }: BoardCardProps) {
    const { isContentBlur, disableVoting } = useAppStore();
    const { t } = useTranslation();

    // Removed internal user fetch, using passed prop currentUserId

    // Local state for optimistic updates
    const [votes, setVotes] = useState(initialVotes);
    const [isLiked, setIsLiked] = useState<boolean | null>(null); // Null = not loaded yet

    // Sync state with props when they change (server update)
    useEffect(() => {
        setVotes(initialVotes);
    }, [initialVotes]);

    useEffect(() => {
        if (currentUserId) {
            setIsLiked(votedUserIds.includes(currentUserId));
        }
    }, [votedUserIds, currentUserId]);

    // Sync comments when props change
    useEffect(() => {
        setCommentsList(Array.isArray(initialComments) ? initialComments : []);
    }, [initialComments]);

    // Permission Logic
    // Card can be deleted by Creator OR Admin
    // Comments can be deleted by Creator OR Admin
    const canDeleteCard = isAdmin || (currentUserId && authorId === currentUserId);

    const [content, setContent] = useState(initialContent);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(initialContent);
    const [cardColor, setCardColor] = useState(initialColor);

    // Sync Color when Column Color changes
    useEffect(() => {
        setCardColor(initialColor);
    }, [initialColor]);

    // Comments Logic
    // We handle mixed legacy strings and new Comment objects
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [commentsList, setCommentsList] = useState<any[]>(
        Array.isArray(initialComments) ? initialComments : []
    );
    const [newComment, setNewComment] = useState("");

    const commentCount = commentsList.length;
    const cardRef = useRef<HTMLDivElement>(null);

    // Auto-close comments on click outside
    useEffect(() => {
        const handleClickOutside = (event: PointerEvent | MouseEvent) => {
            if (isCommentsOpen && cardRef.current && !cardRef.current.contains(event.target as Node)) {
                setIsCommentsOpen(false);
            }
        };

        if (isCommentsOpen) {
            document.addEventListener("pointerdown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
        };
    }, [isCommentsOpen]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: isEditing || isCommentsOpen });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        scale: isDragging ? 1.05 : 1,
    };

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disableVoting) return;

        // Determine next state based on current LOCAL state
        // If isLiked is null (loading), assume derived prop or false?
        const currentLiked = isLiked ?? false;

        // Block voting if limit reached and we are trying to vote (not unvote)
        // Block voting if limit reached and we are trying to vote (not unvote)
        if (!currentLiked && !canVote) {
            alert(t('board.vote_limit_reached') || "Max votes reached");
            return;
        }

        // If onVote is provided (parent controlled), call it and let parent handle logic/service
        if (onVote) {
            onVote();
            // We can optimistic update here too for immediate feedback, 
            // OR rely on parent prop update. 
            // For snappiness, let's keep local optimistic update but NOT call service strictly if parent does.
            // But if we optimistically update, we might desync if parent fails.
            // Let's assume parent handles service.

            // To ensure UI feels instant:
            const nextLiked = !currentLiked;
            setIsLiked(nextLiked);
            setVotes(v => nextLiked ? v + 1 : Math.max(0, v - 1));
            return;
        }

        // Fallback for standalone usage (if any)
        const nextLiked = !currentLiked;
        setIsLiked(nextLiked);
        setVotes(v => nextLiked ? v + 1 : Math.max(0, v - 1));
        await dataService.voteCard(id, currentUserId || 'anon');
    };

    // Helper for rendering
    const showLiked = isLiked ?? false;

    const handleDelete = () => {
        if (onDelete) onDelete();
    };

    const handleSaveEdit = async () => {
        setIsEditing(false);
        if (editContent !== content) {
            setContent(editContent);
            await dataService.updateCard(id, editContent);
        }
    };

    const handleColorChange = async (newColor: string) => {
        setCardColor(newColor);
        await dataService.updateCardColor(id, newColor);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        }
    };

    // User for comments
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isCommentAnonymous, setIsCommentAnonymous] = useState(false);

    useEffect(() => {
        dataService.getCurrentUser().then(setCurrentUser);
    }, []);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        const authorName = isCommentAnonymous ? 'Anonymous' : (currentUser?.full_name || currentUser?.email?.split('@')[0] || 'User');
        const authorAvatar = isCommentAnonymous ? undefined : currentUser?.avatar_url;

        // Optimistic add
        const optimisticComment = {
            id: Math.random().toString(), // Temp ID
            text: newComment,
            author_id: currentUserId,
            created_at: new Date().toISOString(),
            is_anonymous: isCommentAnonymous,
            author_name: authorName,
            author_avatar: authorAvatar
        };

        setCommentsList([...commentsList, optimisticComment]);
        await dataService.addComment(id, newComment, currentUserId || 'anon', {
            isAnonymous: isCommentAnonymous,
            authorName,
            authorAvatar
        });
        setNewComment("");
    };

    const handleDeleteComment = async (commentId: string) => {
        setCommentsList(list => list.filter(c => (c.id || c) !== commentId));
        await dataService.deleteComment(id, commentId);
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none select-none relative group mb-3">
            <Card ref={cardRef}
                className={cn(
                    "relative p-3 border-0 text-white cursor-grab active:cursor-grabbing min-h-[80px] flex flex-col rounded-sm shadow-sm", // Sharp corners
                    "transition-colors duration-500 ease-in-out", // Smooth Color Transition
                    (!cardColor || !cardColor.startsWith('#')) && (cardColor || "bg-slate-500"), // Default fallback class
                    "hover:shadow-md outline-none ring-offset-2 focus-visible:ring-2"
                )}
                style={cardColor && cardColor.startsWith('#') ? { backgroundColor: cardColor } : undefined}
            >
                {/* Kebab Menu - Drag Safe Area */}
                <div className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/70 hover:text-white hover:bg-black/20 rounded-sm">
                                <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                <Edit2 className="mr-2 h-4 w-4" /> {t('board.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsCommentsOpen(!isCommentsOpen)}>
                                <MessageSquare className="mr-2 h-4 w-4" /> {isCommentsOpen ? t('board.hide_comments') : t('board.show_comments')}
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <Palette className="mr-2 h-4 w-4" /> {t('board.color')}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="p-1 grid grid-cols-5 gap-1">
                                    {CARD_COLORS.map(c => (
                                        <div
                                            key={c.name}
                                            className={cn("w-6 h-6 rounded-sm cursor-pointer border border-transparent hover:border-slate-500", c.class)}
                                            onClick={() => handleColorChange(c.class)}
                                            title={t(`colors.${c.name.toLowerCase()}` as any)}
                                        />
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            {canDeleteCard && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
                                        <Trash2 className="mr-2 h-4 w-4" /> {t('board.delete')}
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {isEditing ? (
                    <textarea
                        className="w-full bg-black/10 text-white placeholder-white/50 text-sm p-1 rounded-sm resize-none focus:outline-none focus:bg-black/20"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <p className={cn(
                        "text-sm font-medium mb-auto pr-4 break-words leading-snug whitespace-pre-wrap",
                        isContentBlur && "blur-[2px] select-none opacity-60"
                    )}>
                        {content}
                    </p>
                )}

                <CardFooter className="p-0 pt-2 flex justify-between items-center text-xs text-white/90 mt-1">
                    <div className="flex items-center gap-2">
                        {/* Author Avatar */}
                        {!isAnonymous && authorAvatar && (
                            <div className="h-5 w-5 rounded-full overflow-hidden border border-white/20" title={authorName}>
                                <img src={authorAvatar} alt="Author" className="h-full w-full object-cover" />
                            </div>
                        )}
                        <div
                            onClick={handleVote}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all active:scale-95 transform",
                                disableVoting
                                    ? "opacity-50 cursor-not-allowed bg-black/5"
                                    : showLiked
                                        ? "bg-black/30 cursor-default"
                                        : "bg-black/10 hover:bg-black/20 cursor-pointer"
                            )}
                            onPointerDown={(e) => e.stopPropagation()}
                            title={disableVoting ? t('board.voting_disabled') : showLiked ? t('board.unvote_tooltip') : t('board.vote_tooltip')}
                        >
                            <Heart className={cn("h-3.5 w-3.5", (votes > 0 || showLiked) ? "fill-red-500 text-red-500" : "text-white")} />
                            <span className="font-semibold">{votes}</span>
                        </div>
                    </div>

                    <div
                        className={cn(
                            "flex items-center gap-1 opacity-70 hover:opacity-100 cursor-pointer p-1 rounded-sm hover:bg-black/10 transition-colors",
                            isCommentsOpen && "bg-black/10 opacity-100"
                        )}
                        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <MessageSquare className="h-3 w-3" />
                        <span>{commentCount}</span>
                    </div>
                </CardFooter>

                {/* Inline Comments Section */}
                {isCommentsOpen && (
                    <div className="mt-3 pt-3 border-t border-white/20 animate-in slide-in-from-top-2 duration-200" onPointerDown={(e) => e.stopPropagation()}>
                        <div className="space-y-2 mb-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                            {commentsList.length === 0 && (
                                <p className="text-xs text-white/60 italic text-center py-2">{t('board.no_comments')}</p>
                            )}
                            {commentsList.map((comment, index) => {
                                const isObj = typeof comment === 'object';
                                const text = isObj ? comment.text : comment;
                                const isAnon = isObj ? comment.is_anonymous : false; // Check anon flag
                                const authorName = isObj && !isAnon ? comment.author_name : 'Anonymous';
                                const authorAvatar = isObj && !isAnon ? comment.author_avatar : null;
                                const commentAuthorId = isObj ? comment.author_id : null;
                                const isCommentAuthor = currentUserId && commentAuthorId === currentUserId;
                                const canDeleteComment = isAdmin || isCommentAuthor;
                                const cId = isObj ? comment.id : index.toString();

                                return (
                                    <div key={cId} className="bg-black/10 p-2 rounded-sm text-xs text-white group/comment flex flex-col gap-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-center gap-2">
                                                {authorAvatar && (
                                                    <img src={authorAvatar} className="w-4 h-4 rounded-full object-cover" alt="avatar" />
                                                )}
                                                <span className="font-bold opacity-75 text-[10px]">{authorName}</span>
                                            </div>
                                            {canDeleteComment && (
                                                <button
                                                    onClick={() => handleDeleteComment(cId)}
                                                    className="opacity-0 group-hover/comment:opacity-100 text-white/50 hover:text-red-400 transition-opacity"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <span className="break-words">{text}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                className="flex-1 bg-black/10 text-white placeholder-white/50 text-xs px-2 py-1.5 rounded-sm focus:outline-none focus:bg-black/20"
                                placeholder={t('board.write_comment')}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            />

                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-1.5 cursor-pointer px-1.5 py-0.5 rounded transition-colors select-none h-7",
                                    isCommentAnonymous ? "bg-slate-800 dark:bg-slate-700 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
                                )}
                                onClick={() => setIsCommentAnonymous(!isCommentAnonymous)}
                                title="Post Anonymously"
                            >
                                <div className={cn("relative flex items-center justify-center transition-all", isCommentAnonymous ? "scale-110" : "scale-100")}>
                                    <Ghost className={cn("h-3.5 w-3.5 transition-colors", isCommentAnonymous ? "text-white" : "text-current")} />
                                </div>
                                <span className={cn("text-[11px] font-medium transition-colors hidden sm:inline", isCommentAnonymous ? "text-white" : "text-current")}>
                                    {isCommentAnonymous ? t('board.anonymous') : t('board.post_anonymously')}
                                </span>
                            </button>

                            <Button
                                size="icon"
                                className="h-7 w-7 bg-white/10 hover:bg-white/20 text-white border-0"
                                onClick={handleAddComment}
                            >
                                <Send className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

        </div>
    );
}
