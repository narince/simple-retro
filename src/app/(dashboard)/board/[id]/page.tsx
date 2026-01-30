
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BoardToolbar } from '@/components/board/board-toolbar';
import { BoardColumn } from '@/components/board/board-column';
import { AddCardDialog } from '@/components/board/add-card-dialog';
import { AddColumnDialog } from '@/components/board/add-column-dialog';
import { InviteDialog } from '@/components/board/invite-dialog';
import { ReactionOverlay } from '@/components/board/reaction-overlay';
import { ConfirmationDialog } from '@/components/dashboard/confirmation-dialog';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { BoardCard } from '@/components/board/board-card';
import { dataService } from '@/services';
import { Board, Column, Card } from '@/services/types';
import { useAppStore } from '@/lib/store';

import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function BoardPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const [board, setBoard] = useState<Board | null>(null);
    const [columns, setColumns] = useState<Column[]>([]);
    const [cards, setCards] = useState<Card[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const [selectedColumnId, setSelectedColumnId] = useState<string | undefined>(undefined);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const [currentUser, setCurrentUser] = useState<any | null>(null);
    useEffect(() => {
        dataService.getCurrentUser().then(u => setCurrentUser(u));
    }, []);

    // Calculate User Votes
    const maxVotes = useAppStore(s => s.maxVotesPerUser);
    const isPresentationMode = useAppStore(s => s.isPresentationMode); // Add this
    const currentUserVotes = cards.reduce((acc, card) => {
        if (currentUser && card.voted_user_ids?.includes(currentUser.id)) {
            return acc + 1;
        }
        return acc;
    }, 0);
    const canVote = currentUserVotes < maxVotes;

    // Member Details State
    const [memberDetails, setMemberDetails] = useState<any[]>([]);

    // Load Data
    useEffect(() => {
        const load = async () => {
            const boardId = params?.id as string;
            if (!boardId) return;

            const loadedBoard = await dataService.getBoard(boardId);

            if (!loadedBoard) {
                // If board not found, maybe redirect to dashboard
                router.push('/dashboard');
                return;
            }

            setBoard(loadedBoard);
            const loadedCols = await dataService.getColumns(boardId);
            setColumns(loadedCols);

            // Flatten cards from all columns
            let allCards: Card[] = [];
            for (const col of loadedCols) {
                const colCards = await dataService.getCards(col.id);
                allCards = [...allCards, ...colCards];
            }

            setCards(allCards);

            // Sync Store
            useAppStore.getState().setIsContentBlur(loadedBoard.are_cards_hidden || false);
            useAppStore.getState().setDisableVoting(loadedBoard.is_voting_disabled || false);
            useAppStore.getState().setHideVoteCount(loadedBoard.are_votes_hidden || false);
            useAppStore.getState().setMaxVotesPerUser(loadedBoard.max_votes || 6);

            // Fetch Member Details
            const allUsers = await dataService.getUsers();

            if (loadedBoard.allowed_user_ids && loadedBoard.allowed_user_ids.length > 0) {
                let members = allUsers.filter(u => loadedBoard.allowed_user_ids?.includes(u.id));

                // Ensure Owner is included
                if (loadedBoard.owner_id && !members.find(u => u.id === loadedBoard.owner_id)) {
                    const owner = allUsers.find(u => u.id === loadedBoard.owner_id);
                    if (owner) members.push(owner);
                }

                // Ensure Current User is included (if they have access, which they do if they are here)
                if (currentUser && !members.find(u => u.id === currentUser.id)) {
                    members.push(currentUser);
                }

                setMemberDetails(members);
            } else {
                // For legacy/public boards, assume at least the current user is present
                // Also try to show the owner if possible
                const visibleMembers = [];

                // Add current user if they are logged in (they are viewing it)
                if (currentUser) {
                    const me = allUsers.find(u => u.id === currentUser.id);
                    if (me) visibleMembers.push(me);
                }

                // If there's an owner and it's not the same person
                if (loadedBoard.owner_id && loadedBoard.owner_id !== currentUser?.id) {
                    const owner = allUsers.find(u => u.id === loadedBoard.owner_id);
                    if (owner) visibleMembers.push(owner);
                }

                setMemberDetails(visibleMembers);
            }

        };
        load();
    }, [params?.id, router, currentUser]); // Added currentUser dependency to refresh when user loads

    const handleAddCard = async (columnId: string, content: string, isAnonymous?: boolean) => {
        if (!board || !content.trim()) return;

        // Get current user details for snapshot
        let authorName = undefined;
        let authorAvatar = undefined;

        if (!isAnonymous && currentUser && currentUser.id !== 'anon') {
            authorName = currentUser.full_name;
            authorAvatar = currentUser.avatar_url;
        }

        const newCard = await dataService.createCard(columnId, content, currentUser?.id || 'anon', {
            isAnonymous,
            authorName,
            authorAvatar
        });
        setCards([...cards, newCard]);
    };

    const handleUpdateColumnTitle = async (columnId: string, newTitle: string) => {
        const updatedCol = await dataService.updateColumn(columnId, newTitle);
        if (updatedCol) {
            setColumns(prev => prev.map(c => c.id === columnId ? updatedCol : c));
        }
    };

    // Need to verify service has updateColumnColor? Types says Column has color. 
    // Assuming updateColumn just does title or we need a new method?
    // Let's assume updateColumn takes partial or we can add updateColumnColor if not exists.
    // Checking interface... updateColumn(columnId, title). It only calls update title in interface.
    // I should check local-storage-service to see if I can hack it or need to add a method.
    // I will add a generic updateColumnColor method or update the interface if needed.
    // For now, let's implement the handler and assume I will fix the service.
    const handleUpdateColumnColor = async (columnId: string, newColor: string) => {
        setColumns(prev => prev.map(c => c.id === columnId ? { ...c, color: newColor } : c));
        await dataService.updateColumnColor(columnId, newColor);
    };

    const handleVote = async (cardId: string) => {
        if (!currentUser) return;

        // Update local state to reflect vote immediately for limit calculation
        setCards(prevCards => prevCards.map(card => {
            if (card.id === cardId) {
                const hasVoted = card.voted_user_ids?.includes(currentUser.id);
                let newVotedIds = card.voted_user_ids || [];
                let newVotes = card.votes;

                if (hasVoted) {
                    newVotedIds = newVotedIds.filter(id => id !== currentUser.id);
                    newVotes = Math.max(0, newVotes - 1);
                } else {
                    newVotedIds = [...newVotedIds, currentUser.id];
                    newVotes = newVotes + 1;
                }

                return { ...card, votes: newVotes, voted_user_ids: newVotedIds };
            }
            return card;
        }));

        await dataService.voteCard(cardId, currentUser.id);
    };

    const [isDeleteColumnOpen, setIsDeleteColumnOpen] = useState(false);
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

    const handleDeleteColumnRequest = (columnId: string) => {
        setColumnToDelete(columnId);
        setIsDeleteColumnOpen(true);
    };

    const handleConfirmDeleteColumn = async () => {
        if (columnToDelete) {
            await dataService.deleteColumn(columnToDelete);
            setColumns(prev => prev.filter(c => c.id !== columnToDelete));
            setCards(prev => prev.filter(c => c.column_id !== columnToDelete));
            setColumnToDelete(null);
        }
    };

    const [isDeleteCardOpen, setIsDeleteCardOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);

    const handleDeleteCardRequest = (cardId: string) => {
        setCardToDelete(cardId);
        setIsDeleteCardOpen(true);
    };

    const handleConfirmDeleteCard = async () => {
        if (cardToDelete) {
            await dataService.deleteCard(cardToDelete);
            setCards(prev => prev.filter(c => c.id !== cardToDelete));
            setCardToDelete(null);
            setIsDeleteCardOpen(false); // Close dialog explicitly
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function findColumnOfCard(cardId: string): string | undefined {
        const card = cards.find(c => c.id === cardId);
        return card?.column_id;
    }

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        setActiveId(active.id as string);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        const overId = over?.id;
        if (!overId || active.id === overId) return;

        const activeCard = cards.find(c => c.id === active.id);
        const overCard = cards.find(c => c.id === overId);

        if (!activeCard) return;

        const activeColumnId = activeCard.column_id;
        const overColumnId = overCard ? overCard.column_id : (
            columns.find(c => c.id === overId)?.id
        );

        if (!overColumnId || activeColumnId === overColumnId) return;

        setCards(prev => prev.map(c =>
            c.id === active.id ? { ...c, column_id: overColumnId } : c
        ));
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        const overId = over?.id;

        if (!overId) return;

        const activeCard = cards.find(c => c.id === active.id);
        if (!activeCard) return;

        const overColumnId = cards.find(c => c.id === overId)?.column_id || columns.find(c => c.id === overId)?.id;

        if (overColumnId && activeCard.column_id !== overColumnId) {
            dataService.updateCardPosition(activeCard.id, overColumnId, 0);
        }
    }

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'order' | 'votes' | 'date'>('order');

    const handleUpdateBoardTitle = async (newTitle: string) => {
        if (!board) return;
        const updatedBoard = await dataService.updateBoard(board.id, { title: newTitle });
        if (updatedBoard) {
            setBoard(updatedBoard);
        }
    };

    const handleDeleteBoard = async () => {
        if (!board) return;
        if (confirm("Are you sure you want to delete this board? This cannot be undone.")) {
            await dataService.deleteBoard(board.id);
            router.push('/dashboard');
        }
    };

    const activeCardData = activeId ? cards.find(c => c.id === activeId) : null;

    // Filter Logic - Moved up to avoid Hooks error
    const [activeUserFilter, setActiveUserFilter] = useState<string | null>(null);

    const handleMemberClick = (userId: string) => {
        setActiveUserFilter(prev => prev === userId ? null : userId);
    };

    if (!board) return <div className="p-10 text-center">{t('board.loading')}</div>;

    // Filter and Sort Cards Logic
    const getFilteredAndSortedCards = (colId: string) => {
        // Simple filtering for now
        let filtered = cards.filter(card => card.column_id === colId);

        if (activeUserFilter) {
            filtered = filtered.filter(c => c.author_id === activeUserFilter && !c.isAnonymous);
        }

        if (searchQuery) {
            filtered = filtered.filter(c => c.content.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (sortBy === 'votes') {
            filtered.sort((a, b) => b.votes - a.votes);
        }

        return filtered;
    };

    const handleAddColumn = async (title: string) => {
        if (!board) return;
        const newCol = await dataService.createColumn(board.id, title);
        setColumns([...columns, newCol]);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 min-h-screen">
                {/* HIDE TOOLBAR IN PRESENTATION MODE */}
                {!isPresentationMode && (
                    <BoardToolbar
                        onAddCard={() => {
                            setIsAddCardOpen(true);
                            setSelectedColumnId(undefined);
                        }}
                        onAddColumn={() => setIsAddColumnOpen(true)}
                        onSearch={setSearchQuery}
                        onSort={setSortBy}
                        boardTitle={board?.title || "Loading..."}
                        onUpdateBoardTitle={handleUpdateBoardTitle}
                        onDeleteBoard={handleDeleteBoard}
                        boardId={board?.id}
                        onInvite={() => setIsInviteOpen(true)}
                        members={memberDetails}
                        activeUserFilter={activeUserFilter}
                        onMemberClick={handleMemberClick}
                        currentUser={currentUser}
                    />
                )}

                <InviteDialog
                    open={isInviteOpen}
                    onOpenChange={setIsInviteOpen}
                    boardId={board?.id || ""}
                    existingMemberIds={board?.allowed_user_ids}
                    onInvite={(user) => {
                        setMemberDetails(prev => [...prev, user]);
                        if (board) {
                            setBoard({
                                ...board,
                                allowed_user_ids: [...(board.allowed_user_ids || []), user.id]
                            });
                        }
                    }}
                />

                <AddCardDialog
                    open={isAddCardOpen}
                    onOpenChange={setIsAddCardOpen}
                    onSubmit={(content, colId) => handleAddCard(colId, content)}
                    columns={columns.map(c => ({ id: c.id, title: c.title }))}
                    defaultColumnId={selectedColumnId || (columns[0]?.id)}
                />

                <ConfirmationDialog
                    open={isDeleteColumnOpen}
                    onOpenChange={setIsDeleteColumnOpen}
                    title={t('dialog.delete_column.title')}
                    description={t('dialog.delete_column.description')}
                    onConfirm={handleConfirmDeleteColumn}
                    variant="destructive"
                    confirmText={t('dialog.delete_board.submit')}
                />

                <ConfirmationDialog
                    open={isDeleteCardOpen}
                    onOpenChange={setIsDeleteCardOpen}
                    title={t('dialog.delete_card.title')}
                    description={t('dialog.delete_card.description')}
                    onConfirm={handleConfirmDeleteCard}
                    variant="destructive"
                    confirmText={t('dialog.delete_board.submit')}
                />

                <AddColumnDialog
                    open={isAddColumnOpen}
                    onOpenChange={setIsAddColumnOpen}
                    onSubmit={handleAddColumn}
                />

                <div className={cn("flex-1 p-6 overflow-x-auto overflow-y-hidden", isPresentationMode && "p-0")}>
                    <div className="flex gap-6 h-full min-w-max pb-4">
                        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                            {columns.map(col => (
                                <BoardColumn
                                    key={col.id}
                                    id={col.id}
                                    title={col.title}
                                    color={col.color || 'bg-slate-500'}
                                    cards={getFilteredAndSortedCards(col.id)}
                                    onAddCard={handleAddCard}
                                    onUpdateTitle={handleUpdateColumnTitle}
                                    onDeleteColumn={() => handleDeleteColumnRequest(col.id)}
                                    onUpdateColor={(color) => handleUpdateColumnColor(col.id, color)}
                                    onDeleteCard={handleDeleteCardRequest}
                                    canVote={!isPresentationMode && canVote} // Disable voting in presentation
                                    onVote={handleVote}
                                    currentUserId={currentUser?.id}
                                    isAdmin={currentUser?.role === 'admin' && !isPresentationMode} // Hide admin controls in presentation
                                />
                            ))}
                        </SortableContext>
                    </div>
                </div>

                <DragOverlay>
                    {activeCardData ? (
                        <BoardCard
                            id={activeCardData.id}
                            content={activeCardData.content}
                            votes={activeCardData.votes}
                            comments={activeCardData.comments}
                            color={columns.find(c => c.id === activeCardData.column_id)?.color}
                            votedUserIds={activeCardData.voted_user_ids}
                            authorName={activeCardData.author_full_name}
                            authorAvatar={activeCardData.author_avatar_url}
                            isAnonymous={activeCardData.isAnonymous}
                        />
                    ) : null}
                </DragOverlay>
                <ReactionOverlay />
            </div>
        </DndContext >
    );
}

