import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface TimerWidgetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TimerWidget({ open, onOpenChange }: TimerWidgetProps) {
    const { t } = useTranslation();
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            interval = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        setIsActive(false);
                        clearInterval(interval);
                        // Trigger sound or alert?
                    } else {
                        setMinutes(minutes - 1);
                        setSeconds(59);
                    }
                } else {
                    setSeconds(seconds - 1);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, minutes, seconds]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setMinutes(5);
        setSeconds(0);
    };

    const formatTime = (time: number) => time.toString().padStart(2, '0');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[300px]">
                <DialogHeader>
                    <DialogTitle>{t('timer.title')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="text-5xl font-mono font-bold text-slate-700 mb-6">
                        {formatTime(minutes)}:{formatTime(seconds)}
                    </div>

                    <div className="flex items-center gap-4 w-full justify-center">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={resetTimer}
                            className="h-10 w-10 text-slate-500"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>

                        <Button
                            onClick={toggleTimer}
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {isActive ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                        </Button>
                    </div>

                    {!isActive && (
                        <div className="mt-6 flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setMinutes(5); setSeconds(0); }}>5m</Button>
                            <Button variant="ghost" size="sm" onClick={() => { setMinutes(10); setSeconds(0); }}>10m</Button>
                            <Button variant="ghost" size="sm" onClick={() => { setMinutes(15); setSeconds(0); }}>15m</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
