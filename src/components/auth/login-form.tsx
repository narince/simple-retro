'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { dataService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTranslation } from '@/lib/i18n';

import { useAppStore } from '@/lib/store';

export function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const setCurrentUser = useAppStore(state => state.setCurrentUser);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize mode from URL param if present
    const [mode, setMode] = useState<'signin' | 'signup'>(() => {
        const queryMode = searchParams.get('mode');
        return queryMode === 'signup' ? 'signup' : 'signin';
    });

    // Standard behavior: Allow browser processing (autofill) for ease of use
    // We removed the aggressive "clear on mount" to support Password Managers.

    const handleAuth = async (e: React.FormEvent) => {
        // ... (keep same logic)
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let result;
            if (mode === 'signup') {
                result = await dataService.signUp(email);
            } else {
                result = await dataService.signIn(email);
            }

            if (result.error) throw new Error(result.error);

            if (result.user) {
                setCurrentUser(result.user);
            }

            router.push('/dashboard');
        } catch (err: any) {
            const message = err.message;
            if (message === 'AUTH_USER_NOT_FOUND') {
                setError(t('error.AUTH_USER_NOT_FOUND'));
            } else if (message === 'AUTH_USER_EXISTS') {
                setError(t('error.AUTH_USER_EXISTS'));
            } else {
                setError(message || t('login.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
                <AnimatePresence mode="wait">
                    <motion.h1
                        key={mode === 'signin' ? 'title-signin' : 'title-signup'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
                    >
                        {mode === 'signin' ? t('login.title') : t('login.create_account')}
                    </motion.h1>
                </AnimatePresence>
            </div>

            <Card className="w-full border-0 shadow-xl bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <CardContent className="pt-6">
                            <form onSubmit={handleAuth} className="space-y-4" method="post" action="#">
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('login.email')}</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="username"
                                        placeholder="name@example.com"
                                        className="h-11 bg-white dark:bg-slate-950"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('login.password')}</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                            className="h-11 bg-white dark:bg-slate-950 pr-10"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full h-11 text-base font-medium bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {mode === 'signin' ? t('login.button') : t('login.button_signup')}
                                </Button>
                            </form>
                        </CardContent>
                    </motion.div>
                </AnimatePresence>
                <CardFooter className="flex justify-center border-t p-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <p className="text-sm text-slate-500">
                        {mode === 'signin' ? t('login.no_account') : t('login.has_account')}
                        <button
                            onClick={() => {
                                setMode(mode === 'signin' ? 'signup' : 'signin');
                                setError(null);
                            }}
                            className="font-semibold text-indigo-600 hover:text-indigo-500 underline underline-offset-4"
                        >
                            {mode === 'signin' ? t('login.signup_action') : t('login.signin_action')}
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
