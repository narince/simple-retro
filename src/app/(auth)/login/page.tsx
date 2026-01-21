'use client';
import { LoginForm } from '@/components/auth/login-form';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTranslation } from '@/lib/i18n';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const { t } = useTranslation();
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative">
            <Link
                href="/"
                className="absolute top-4 left-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                title="Back to Home"
            >
                <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <div className="mb-8 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                    {/* Consistent CSS Logo */}
                    <div className="flex flex-col gap-[3px]">
                        <div className="w-5 h-[3px] bg-blue-600 rounded-full"></div>
                        <div className="w-5 h-[3px] bg-blue-600 rounded-full"></div>
                        <div className="w-3 h-[3px] bg-blue-600 rounded-full"></div>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">SimpleRetro</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('login.tagline')}
                </p>
            </div>
            <LoginForm />
        </div>
    );
}
