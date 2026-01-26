"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function PrivacyPage() {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-50">
            <div className="container mx-auto px-6 py-12 max-w-4xl">
                <div className="mb-8">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600">
                            <ArrowLeft className="h-4 w-4" /> Back to Home
                        </Button>
                    </Link>
                </div>

                <h1 className="text-4xl font-extrabold mb-8 tracking-tight">{t('privacy.title')}</h1>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="lead text-xl text-slate-600 dark:text-slate-400 mb-8">
                        {t('privacy.content')}
                    </p>
                    {/* ... (Other content would be localized similarly in a real app, keeping it simple for now as per keys) ... */}
                </div>
            </div>
        </div>
    );
}
