'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
    const { language, setLanguage } = useAppStore();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2 h-8 text-slate-500 hover:text-slate-800">
                    <Globe className="h-4 w-4" />
                    <span className="uppercase text-xs font-bold">{language}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('tr')} className={language === 'tr' ? 'bg-slate-100 font-bold' : ''}>
                    TR
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-slate-100 font-bold' : ''}>
                    EN
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
