"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ModeToggle } from "@/components/mode-toggle";
import { Star, Shield, Menu } from 'lucide-react';
import { dataService } from '@/services';
import { User } from '@/services/types';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";

import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTranslation } from '@/lib/i18n';
import { getInitials } from '@/lib/utils'; // Add this import

import { useAppStore } from '@/lib/store';

export function Header() {
    const router = useRouter();
    // Use global store
    const user = useAppStore(state => state.currentUser);
    const setCurrentUser = useAppStore(state => state.setCurrentUser);
    const { t } = useTranslation();
    const { setTheme } = useTheme();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Initial fetch if not present
        if (!user) {
            dataService.getCurrentUser().then(setCurrentUser);
        }

        // Initialize language
        const savedLang = localStorage.getItem('retro-language') as 'tr' | 'en';
        if (savedLang && savedLang !== useAppStore.getState().language) {
            useAppStore.getState().setLanguage(savedLang);
        }
    }, []);

    const handleLogout = async () => {
        await dataService.signOut();
        router.push('/login');
    };

    if (!mounted) {
        return (
            <header className="sticky top-0 z-[70] w-full border-b bg-white/80 backdrop-blur-md border-slate-200 dark:border-slate-800 dark:bg-zinc-950/80">
                <div className="flex h-16 items-center justify-between px-6 w-full">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
                                <div className="flex flex-col gap-[3px]">
                                    <div className="w-5 h-[3px] bg-blue-600 rounded-full"></div>
                                    <div className="w-5 h-[3px] bg-blue-600 rounded-full"></div>
                                    <div className="w-3 h-[3px] bg-blue-600 rounded-full"></div>
                                </div>
                                <span>SimpleRetro</span>
                            </div>
                        </Link>
                    </div>

                    {/* Right: Placeholders */}
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-[70] w-full border-b bg-white/80 backdrop-blur-md border-slate-200 dark:border-slate-800 dark:bg-zinc-950/80">
            <div className="flex h-16 items-center justify-between px-6 w-full">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
                            {/* Simple CSS Icon based on EasyRetro Logo (3 lines) */}
                            <div className="flex flex-col gap-[3px]">
                                <div className="w-5 h-[3px] bg-blue-600 rounded-full"></div>
                                <div className="w-5 h-[3px] bg-blue-600 rounded-full"></div>
                                <div className="w-3 h-[3px] bg-blue-600 rounded-full"></div>
                            </div>
                            <span>SimpleRetro</span>
                        </div>
                    </Link>
                </div>

                {/* Right: User Info */}
                <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <div className="hidden md:flex items-center gap-2">
                        <ModeToggle />
                        <LanguageSwitcher />
                    </div>

                    {user ? (
                        <>
                            <span className="hidden md:inline-block text-slate-700 dark:text-slate-200">{user.email}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 p-0 overflow-hidden ring-2 ring-transparent hover:ring-blue-500/20 transition-all">
                                        <Avatar className="h-9 w-9">
                                            {user.avatar_url ? (
                                                <AvatarImage src={user.avatar_url} alt={user.full_name} className="object-cover" />
                                            ) : null}
                                            <AvatarFallback className="bg-blue-600 text-white font-bold">
                                                {getInitials(user.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 z-[100]" align="end" forceMount>
                                    <DropdownMenuItem className="font-medium mb-1">{user.full_name}</DropdownMenuItem>
                                    {user.role === 'admin' && (
                                        <DropdownMenuItem onClick={() => router.push('/admin/users')}>
                                            {t('header.admin_users')}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => router.push('/profile')}>{t('header.profile')}</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => router.push('/settings')}>{t('header.settings')}</DropdownMenuItem>

                                    <DropdownMenuSeparator className="md:hidden" />


                                    {/* Mobile: Theme & Language */}
                                    <div className="md:hidden">
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>{t('header.theme')}</DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onClick={() => setTheme('light')}>{t('theme.light')}</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setTheme('dark')}>{t('theme.dark')}</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setTheme('system')}>{t('theme.system')}</DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>

                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>{t('header.language')}</DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onClick={() => useAppStore.getState().setLanguage('tr')}>Türkçe</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => useAppStore.getState().setLanguage('en')}>English</DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                    </div>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 dark:text-red-400">
                                        {t('header.logout')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            {/* Desktop: Separate Buttons */}
                            <div className="hidden md:flex items-center gap-2">
                                <ModeToggle />
                                <Link href="/login">
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-full px-6">{t('header.login')}</Button>
                                </Link>
                            </div>

                            {/* Mobile: Hamburger Menu */}
                            <div className="md:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Menu className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push('/login')}>
                                            <span className="font-bold text-blue-600">{t('header.login')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />

                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>{t('header.theme')}</DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onClick={() => setTheme('light')}>{t('theme.light')}</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setTheme('dark')}>{t('theme.dark')}</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setTheme('system')}>{t('theme.system')}</DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>

                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>{t('header.language')}</DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onClick={() => useAppStore.getState().setLanguage('tr')}>Türkçe</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => useAppStore.getState().setLanguage('en')}>English</DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
