
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";

interface AddCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (content: string, columnId: string) => Promise<void>;
    columns: { id: string; title: string }[];
    defaultColumnId?: string;
}

export function AddCardDialog({
    open,
    onOpenChange,
    onSubmit,
    columns,
    defaultColumnId
}: AddCardDialogProps) {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [columnId, setColumnId] = useState(defaultColumnId || (columns[0]?.id));
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !columnId) return;

        setLoading(true);
        try {
            await onSubmit(content, columnId);
            setContent('');
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('dialog.add_card.title')}</DialogTitle>
                    <DialogDescription>
                        {t('dialog.add_card.description')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="column">{t('dialog.add_card.column')}</Label>
                        <Select value={columnId} onValueChange={setColumnId}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('dialog.add_card.column_placeholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {columns.map((col) => (
                                    <SelectItem key={col.id} value={col.id}>
                                        {col.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="content">{t('dialog.add_card.content')}</Label>
                        <Textarea
                            id="content"
                            placeholder={t('dialog.add_card.content_placeholder')}
                            className="col-span-3 min-h-[100px]"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? t('dialog.add_card.submitting') : t('dialog.add_card.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
