'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layout, Zap, Users, Menu } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useAppStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { t } = useTranslation();
  const { setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 dark:bg-zinc-950 dark:text-slate-50">
      {/* Navbar */}
      <nav className="fixed z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
            {/* Logo Icon */}
            <div className="flex flex-col gap-[3px]">
              <div className="h-[3px] w-5 rounded-full bg-blue-600"></div>
              <div className="h-[3px] w-5 rounded-full bg-blue-600"></div>
              <div className="h-[3px] w-3 rounded-full bg-blue-600"></div>
            </div>
            <span>SimpleRetro</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <ModeToggle />
              <LanguageSwitcher />
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                {t('header.login')}
              </Link>
              <Link href="/login?mode=signup">
                <Button className="rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
                  {t('login.signup_action')}
                </Button>
              </Link>
            </div>

            {/* Mobile Actions (Hamburger) */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex w-full cursor-pointer font-medium">
                      {t('header.login')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/login?mode=signup" className="flex w-full cursor-pointer font-bold text-blue-600">
                      {t('login.signup_action')}
                    </Link>
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            {t('settings.enable_features')}
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-50 md:text-7xl relative z-10">
            {t('home.title_prefix')} <br />
            <span className="relative inline-block">
              <motion.span
                className="absolute -inset-8 rounded-[3rem] opacity-30 blur-3xl dark:opacity-40 will-change-transform" // Increased inset/radius, removed mix-blend, added will-change
                style={{
                  background: "linear-gradient(120deg, #2563eb, #db2777, #7c3aed, #4f46e5, #2563eb)",
                  backgroundSize: "300% 300%",
                  transform: "translate3d(0,0,0)" // Force hardware acceleration
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  scale: [0.9, 1.1, 0.95, 0.9], // Slightly gentler scale to avoid clipping
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 8, // Slightly slower for smoother feel
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.span
                className="relative bg-gradient-to-r from-blue-600 via-pink-500 to-violet-600 bg-clip-text text-transparent bg-[length:250%_auto]"
                animate={{
                  backgroundPosition: ["0% center", "200% center"]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                {t('home.title_highlight')}
              </motion.span>
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-slate-500 dark:text-slate-400">
            {t('home.description')}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link href="/login">
              <Button
                size="lg"
                className="h-14 rounded-full bg-blue-600 px-8 text-lg text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 hover:bg-blue-700"
              >
                {t('home.get_started')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="pt-12 text-sm font-medium text-slate-400">
            {t('home.pricing_tagline')}
          </div>
        </div>
      </section>

      {/* Visual Preview / Feature Grid */}
      <section className="bg-slate-50 py-20 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Zap className="h-6 w-6 text-indigo-600" />,
                title: t('home.features.realtime.title'),
                desc: t('home.features.realtime.desc'),
              },
              {
                icon: <Users className="h-6 w-6 text-rose-600" />,
                title: t('home.features.management.title'),
                desc: t('home.features.management.desc'),
              },
              {
                icon: <Layout className="h-6 w-6 text-teal-600" />,
                title: t('home.features.customizable.title'),
                desc: t('home.features.customizable.desc'),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-zinc-900"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-800">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-50">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-slate-500 dark:text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-12 dark:border-slate-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-sm text-slate-500 md:flex-row">
          <div>{t('home.footer')}</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300">
              {t('home.privacy')}
            </Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-300">
              {t('home.terms')}
            </Link>
            <Link href="/contact" className="hover:text-slate-900 dark:hover:text-slate-300">
              {t('home.contact')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
