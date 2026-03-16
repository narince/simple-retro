"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function ContactPage() {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-50">
            <div className="container mx-auto px-6 py-12 max-w-4xl">
                <div className="mb-8">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600">
                            <ArrowLeft className="h-4 w-4" /> {t('contact.back_home')}
                        </Button>
                    </Link>
                </div>

                <h1 className="text-4xl font-extrabold mb-4 tracking-tight">{t('contact.title')}</h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-12">
                    {t('contact.content')}
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">{t('contact.section_email')}</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-2">{t('contact.email_desc')}</p>
                                <a href="mailto:support@simpleretro.demo" className="text-blue-600 hover:underline font-medium">support@simpleretro.demo</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">{t('contact.section_office')}</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-2">{t('contact.office_desc')}</p>
                                <p className="text-slate-900 dark:text-slate-100 font-medium">
                                    100 Smith Street<br />
                                    Collingwood VIC 3066 AU
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-xl mb-6">{t('contact.send_message_title')}</h3>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">{t('contact.form_email')}</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="you@company.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">{t('contact.form_message')}</label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={t('contact.form_placeholder')}
                                ></textarea>
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                {t('contact.send_button')}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
