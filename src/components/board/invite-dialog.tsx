"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { dataService } from "@/services";
import { User } from "@/services/types";
import { Check, Search, UserPlus } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface InviteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    boardId: string;
    existingMemberIds?: string[];
    onInvite: (user: User) => void; // Callback with user object
}

export function InviteDialog({ open, onOpenChange, boardId, existingMemberIds = [], onInvite }: InviteDialogProps) {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadUsers = async () => {
        const allUsers = await dataService.getUsers();
        // Filter out users who are already members
        // Actually, let's show them but mark as "Joined"
        setUsers(allUsers);
    };

    useEffect(() => {
        if (open) {
            loadUsers();
            setInvitedUsers([]); // Reset session invites
        }
    }, [open]);

    const handleInvite = async (user: User) => {
        if (invitedUsers.includes(user.id)) return;

        setIsLoading(true);
        await dataService.inviteUserToBoard(boardId, user.id);
        setInvitedUsers(prev => [...prev, user.id]);
        setIsLoading(false);
        onInvite(user);
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('dialog.invite.title')}</DialogTitle>
                    <DialogDescription>
                        {t('dialog.invite.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <input
                        className="w-full bg-slate-100 dark:bg-zinc-900 pl-9 pr-4 py-2 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-slate-200 placeholder:text-slate-500"
                        placeholder={t('dialog.invite.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredUsers.length === 0 && (
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">{t('dialog.invite.no_users')}</p>
                    )}
                    {filteredUsers.map(user => {
                        const isMember = existingMemberIds.includes(user.id) || invitedUsers.includes(user.id);
                        // Check if this user is the owner (needs board owner info passed in props, or assume)
                        // For now we don't have ownerId passed to InviteDialog. Let's assume for simplicity we label "Member".

                        return (
                            <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-md transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                {getInitials(user.full_name)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium truncate dark:text-slate-200">{user.full_name}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
                                    </div>
                                </div>

                                {isMember ? (
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                                        <Check className="h-3 w-3" /> {t('dialog.invite.member')}
                                    </span>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs gap-1 group-hover:border-blue-300 dark:group-hover:border-blue-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 dark:bg-zinc-900 dark:border-slate-700 dark:text-slate-300"
                                        onClick={() => handleInvite(user)}
                                        disabled={isLoading}
                                    >
                                        <UserPlus className="h-3 w-3" /> {t('board.invite')}
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('dialog.invite.close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
