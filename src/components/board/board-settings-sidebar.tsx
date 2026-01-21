import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Lock, Eye, EyeOff, ThumbsUp, MessageSquare, Image as ImageIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { dataService } from "@/services";
import { useTranslation } from "@/lib/i18n";

interface BoardSettingsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    boardId?: string;
}

export function BoardSettingsSidebar({ isOpen, onClose, boardId }: BoardSettingsSidebarProps) {
    const { t } = useTranslation();
    const {
        hideCards, setHideCards,
        disableVoting, setDisableVoting,
        hideVoteCount, setHideVoteCount,
        maxVotesPerUser, setMaxVotesPerUser,
        isContentBlur, setIsContentBlur,
        maxVotesScope, setMaxVotesScope,
        featureFlags, setFeatureFlag
    } = useAppStore();

    const [isPresentationMode, setIsPresentationMode] = useState(false);
    const [isHighlightMode, setIsHighlightMode] = useState(false);

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    const handleToggleHideCards = async (checked: boolean) => {
        setIsContentBlur(checked);
        if (boardId) await dataService.updateBoard(boardId, { are_cards_hidden: checked });
    };

    const handleToggleDisableVoting = async (checked: boolean) => {
        setDisableVoting(checked);
        if (boardId) await dataService.updateBoard(boardId, { is_voting_disabled: checked });
    };

    const handleToggleHideVoteCount = async (checked: boolean) => {
        setHideVoteCount(checked);
        if (boardId) await dataService.updateBoard(boardId, { are_votes_hidden: checked });
    };

    const handleMaxVotesChange = async (votes: number) => {
        setMaxVotesPerUser(votes);
        if (boardId) await dataService.updateBoard(boardId, { max_votes: votes });
    };

    const handleToggleFeature = async (feature: 'gifs' | 'reactions' | 'comments' | 'password') => {
        const newValue = !featureFlags[feature];
        setFeatureFlag(feature, newValue);
        // Persist if needed (requires board update support for these flags)
        if (boardId) {
            // Mapping feature flags to backend fields would go here
            // For now we assume local state or we need to add fields to updateBoard
            const updates: any = {};
            if (feature === 'gifs') updates.is_gifs_enabled = newValue;
            if (feature === 'reactions') updates.is_reactions_enabled = newValue;
            if (feature === 'comments') updates.is_comments_enabled = newValue;
            // password logic is complex (needs dialog), just toggling flag for UI for now
            if (Object.keys(updates).length > 0) {
                await dataService.updateBoard(boardId, updates);
            }
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-transparent z-50 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed top-[64px] right-0 h-[calc(100vh-64px)] w-[320px] bg-white dark:bg-zinc-950 border-l dark:border-slate-800 shadow-xl z-[51] transition-transform duration-300 transform",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
                        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('settings.title')}</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 dark:hover:bg-zinc-800">
                            <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* Top Toggles */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="hide-cards"
                                        checked={isContentBlur}
                                        onCheckedChange={handleToggleHideCards}
                                    />
                                    <Label htmlFor="hide-cards" className="font-medium cursor-pointer text-slate-700 dark:text-slate-300">{t('settings.blur_content')}</Label>
                                    <EyeOff className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="disable-voting"
                                        checked={disableVoting}
                                        onCheckedChange={handleToggleDisableVoting}
                                    />
                                    <Label htmlFor="disable-voting" className="font-medium cursor-pointer text-slate-700 dark:text-slate-300">{t('settings.disable_voting')}</Label>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="hide-vote-count"
                                        checked={hideVoteCount}
                                        onCheckedChange={handleToggleHideVoteCount}
                                    />
                                    <Label htmlFor="hide-vote-count" className="font-medium cursor-pointer text-slate-700 dark:text-slate-300">{t('settings.hide_vote_counts')}</Label>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="presentation"
                                        checked={isPresentationMode}
                                        onCheckedChange={setIsPresentationMode}
                                    />
                                    <Label htmlFor="presentation" className="font-medium cursor-pointer text-slate-700 dark:text-slate-300">{t('settings.presentation_mode')}</Label>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="highlight"
                                        checked={isHighlightMode}
                                        onCheckedChange={setIsHighlightMode}
                                    />
                                    <Label htmlFor="highlight" className="font-medium cursor-pointer text-slate-700 dark:text-slate-300">{t('settings.highlight_mode')}</Label>
                                </div>
                            </div>
                        </div>

                        {/* Max Votes */}
                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">{t('settings.max_votes_per_user')}</Label>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="voteScope"
                                            checked={maxVotesScope === 'board'}
                                            onChange={() => setMaxVotesScope('board')}
                                            className="accent-blue-600"
                                        />
                                        <span>{t('settings.board')}</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="voteScope"
                                            checked={maxVotesScope === 'column'}
                                            onChange={() => setMaxVotesScope('column')}
                                            className="accent-blue-600"
                                        />
                                        <span>{t('settings.column')}</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8 dark:bg-zinc-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-zinc-800" onClick={() => handleMaxVotesChange(Math.max(0, maxVotesPerUser - 1))}>-</Button>
                                    <Input
                                        type="number"
                                        value={maxVotesPerUser}
                                        onChange={(e) => handleMaxVotesChange(parseInt(e.target.value) || 0)}
                                        className="h-8 w-14 text-center dark:bg-zinc-900 dark:border-slate-700 dark:text-white"
                                    />
                                    <Button variant="outline" size="icon" className="h-8 w-8 dark:bg-zinc-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-zinc-800" onClick={() => handleMaxVotesChange(maxVotesPerUser + 1)}>+</Button>
                                </div>
                            </div>
                        </div>

                        {/* Background */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button variant="outline" className="w-full justify-start h-9 text-slate-600 dark:text-slate-300 dark:bg-zinc-900 dark:border-slate-700 dark:hover:bg-zinc-800">
                                <ImageIcon className="mr-2 h-4 w-4" /> {t('settings.add_background')}
                            </Button>
                        </div>

                        {/* Enable Features */}
                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Label className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">{t('settings.enable_features')}</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-20 flex flex-col items-center justify-center gap-2 dark:border-slate-700 dark:bg-zinc-900 transition-all",
                                        featureFlags.gifs ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:border-blue-500"
                                    )}
                                    onClick={() => handleToggleFeature('gifs')}
                                >
                                    <div className={cn("p-1 rounded font-bold text-xs", featureFlags.gifs ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>GIF</div>
                                    <span className="text-[10px]">{t('settings.feature.gif')}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-20 flex flex-col items-center justify-center gap-2 dark:border-slate-700 dark:bg-zinc-900 transition-all",
                                        featureFlags.reactions ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:border-blue-500"
                                    )}
                                    onClick={() => handleToggleFeature('reactions')}
                                >
                                    <ThumbsUp className={cn("h-4 w-4", featureFlags.reactions ? "" : "dark:text-slate-400")} />
                                    <span className="text-[10px]">{t('settings.feature.reactions')}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-20 flex flex-col items-center justify-center gap-2 dark:border-slate-700 dark:bg-zinc-900 transition-all",
                                        featureFlags.comments ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:border-blue-500"
                                    )}
                                    onClick={() => handleToggleFeature('comments')}
                                >
                                    <MessageSquare className={cn("h-4 w-4", featureFlags.comments ? "" : "dark:text-slate-400")} />
                                    <span className="text-[10px]">{t('settings.feature.comments')}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "h-20 flex flex-col items-center justify-center gap-2 dark:border-slate-700 dark:bg-zinc-900 transition-all",
                                        featureFlags.password ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:border-blue-500"
                                    )}
                                    onClick={() => handleToggleFeature('password')}
                                >
                                    <Lock className={cn("h-4 w-4", featureFlags.password ? "" : "dark:text-slate-400")} />
                                    <span className="text-[10px]">{t('settings.feature.password')}</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
