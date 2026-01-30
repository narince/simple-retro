import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface BoardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (title: string, options?: { maxVotes: number; templateId: string }) => void;
    initialTitle?: string;
    mode: 'create' | 'rename';
}

export function BoardDialog({ open, onOpenChange, onSubmit, initialTitle = "", mode }: BoardDialogProps) {
    const { t } = useTranslation();
    const [title, setTitle] = useState(initialTitle);
    const [maxVotes, setMaxVotes] = useState(6);
    const [templateId, setTemplateId] = useState('went-well-to-improve');

    // Dynamic templates based on language
    const TEMPLATES = [
        {
            id: 'went-well-to-improve',
            name: t('templates.went_well_to_improve'),
            columns: [
                { title: t('templates.column.went_well'), color: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
                { title: t('templates.column.to_improve'), color: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' },
                { title: t('templates.column.action_items'), color: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800' }
            ]
        },
        {
            id: 'start-stop-continue',
            name: t('templates.start_stop_continue'),
            columns: [
                { title: t('templates.column.start'), color: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800' },
                { title: t('templates.column.stop'), color: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' },
                { title: t('templates.column.continue'), color: 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800' }
            ]
        },
        {
            id: 'mad-sad-glad',
            name: t('templates.mad_sad_glad'),
            columns: [
                { title: t('templates.column.mad'), color: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' },
                { title: t('templates.column.sad'), color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
                { title: t('templates.column.glad'), color: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' }
            ]
        },
        {
            id: 'lean-coffee',
            name: t('templates.lean_coffee'),
            columns: [
                { title: t('templates.column.to_discuss'), color: 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800' },
                { title: t('templates.column.discussing'), color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
                { title: t('templates.column.done'), color: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' }
            ]
        },
    ];

    const selectedTemplate = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];

    useEffect(() => {
        if (open) {
            setTitle(initialTitle);
            setMaxVotes(6);
            setTemplateId('went-well-to-improve');
        }
    }, [open, initialTitle, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSubmit(title, { maxVotes, templateId });
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border-slate-200 dark:border-slate-800">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {mode === 'create' ? t('dialog.create_board.title') : t('dialog.rename_board.title')}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        {mode === 'create' ? t('dialog.create_board.desc') : t('dialog.rename_board.desc')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-semibold text-slate-700 dark:text-slate-300">{t('dialog.create_board.name')}</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Sprint 42 Retro"
                                className="h-10 text-base bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        {mode === 'create' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-700 dark:text-slate-300">{t('dialog.create_board.template')}</Label>
                                    <Select value={templateId} onValueChange={setTemplateId}>
                                        <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-slate-800 dark:text-slate-300">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-zinc-950 dark:border-slate-800">
                                            {TEMPLATES.map(tmpl => (
                                                <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {/* Template Preview */}
                                    <div className="mt-2 flex gap-2">
                                        {selectedTemplate.columns.map((col, i) => (
                                            <div key={i} className={`flex-1 p-2 border rounded text-center text-xs font-semibold ${col.color}`}>
                                                {col.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-semibold text-slate-700 dark:text-slate-300">{t('dialog.create_board.max_votes')}</Label>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('dialog.create_board.max_votes_help')}</p>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={maxVotes}
                                            onChange={(e) => setMaxVotes(parseInt(e.target.value) || 0)}
                                            className="w-20 text-center h-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 dark:text-slate-200"
                                        />
                                        <Button type="button" variant="outline" size="icon" className="h-10 w-10 dark:bg-zinc-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-zinc-800" onClick={() => setMaxVotes(maxVotes + 1)}><Plus className="h-4 w-4" /></Button>
                                        <Button type="button" variant="outline" size="icon" className="h-10 w-10 dark:bg-zinc-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-zinc-800" onClick={() => setMaxVotes(Math.max(0, maxVotes - 1))}><Minus className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-4 flex justify-end border-t border-slate-100 dark:border-slate-800">
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 h-10 shadow-lg shadow-blue-500/20 rounded-full transition-all">
                            {mode === 'create' ? t('dialog.create_board.submit') : t('dialog.rename_board.submit')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
