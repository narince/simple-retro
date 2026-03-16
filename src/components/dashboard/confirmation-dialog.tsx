import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText,
    cancelText,
    variant = "default",
}: ConfirmationDialogProps) {
    const { t } = useTranslation();

    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {cancelText || t('dialog.cancel')}
                    </Button>
                    <Button variant={variant} onClick={handleConfirm}>
                        {confirmText || t('dialog.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
