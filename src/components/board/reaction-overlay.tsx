'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Flame, ThumbsUp, PartyPopper, Star, Zap } from "lucide-react";

import { VozolIcon } from "@/components/icons/vozol-icon";
import { dataService } from "@/services";

// Helper to map emoji/key to Icon component
const getReactionIcon = (emoji: string) => {
    switch (emoji) {
        case '❤️': return <Heart className="w-12 h-12 fill-red-600 text-red-600 drop-shadow-xl filter" />;
        case '🔥': return <Flame className="w-12 h-12 fill-orange-500 text-orange-600 drop-shadow-xl filter" />;
        case '👍': return <ThumbsUp className="w-12 h-12 fill-blue-600 text-blue-700 drop-shadow-xl filter" />;
        case '🎉': return <PartyPopper className="w-12 h-12 text-yellow-500 drop-shadow-xl filter" />;
        case '⭐': return <Star className="w-12 h-12 fill-yellow-400 text-yellow-600 drop-shadow-xl filter" />;
        case '⚡': return <Zap className="w-12 h-12 fill-yellow-400 text-yellow-600 drop-shadow-xl filter" />;
        case 'vozol': return <VozolIcon className="w-20 h-40" />;
        case 'smoke': return (
            <div className="w-16 h-16 rounded-full bg-slate-400/60 blur-xl dark:bg-slate-500/50" />
        );
        default: return <span className="text-4xl filter drop-shadow-md">{emoji}</span>;
    }
};

interface Reaction {
    id: string;
    emoji: string;
    x: number;
    yStart: number;
    duration: number;
    delay: number;
    rotate: number;
    sway: number;
}

export function ReactionOverlay() {
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        dataService.getCurrentUser().then(u => setCurrentUserId(u?.id || null));
    }, []);

    useEffect(() => {
        const addShower = (emoji: string) => {
            const isVozol = emoji === 'vozol';
            const count = isVozol ? 80 : 100;
            const newReactions: Reaction[] = [];

            if (isVozol) {
                // Check if device already exists
                // We use a functional update to check 'current' state if called multiple times rapidly?
                // Actually 'reactions' here is closure stale if not careful.
                // But we use setReactions(prev => ...)
                // We can't check 'prev' inside this sync function easily without ref.
                // Using a simple document selector or global var for a singleton check is hacky but effective for UI.
                // Or filtered state.

                // Better: We check inside the setReactions call? No, we need to push to newReactions array first.
                // Let's assume we want to avoid ADDING if we think one is there.
                // Let's check the current state `reactions`.
                // Note: `reactions` in this scope might be stale.
                // However, usually `addShower` is called from event or poll.

                // Singleton check:
                // We'll trust the current `reactions` state in this scope for now.
                // If the device is long-lived (5s), it should be in state.
                const hasDevice = document.getElementById('vozol-device-active');

                if (!hasDevice) {
                    newReactions.push({
                        id: 'vozol-device-' + Date.now(), // Unique but identifiable
                        emoji: 'vozol',
                        x: 50, // Dead center
                        yStart: 40, // 40vh (Centerish)
                        duration: 5.0,
                        delay: 0,
                        rotate: 0,
                        sway: 0
                    });
                }

                // Smoke always adds up
                for (let i = 0; i < 80; i++) {
                    const id = Math.random().toString(36).substring(7) + i;
                    // Center origin with VERY slight spread initially
                    const spread = Math.random() * 4 - 2;
                    const x = 50 + spread;

                    const duration = 3.0 + Math.random() * 2.5;
                    const delay = 0.5 + Math.random() * 1.5; // Start earlier since device is static/fading
                    const sway = (Math.random() - 0.5) * 60;

                    newReactions.push({ id, emoji: 'smoke', x, yStart: 38, duration, delay, rotate: 0, sway });
                }

            } else {
                // Standard Confetti Logic
                for (let i = 0; i < count; i++) {
                    const id = Math.random().toString(36).substring(7) + i;
                    const x = Math.random() * 100;
                    const duration = 2.0 + Math.random() * 1.5;
                    const delay = Math.random() * 0.5;
                    const rotate = (Math.random() - 0.5) * 360;
                    const sway = (Math.random() - 0.5) * 40;
                    const yStart = -10 - Math.random() * 40;
                    newReactions.push({ id, emoji, x, yStart, duration, delay, rotate, sway });
                }
            }

            setReactions(prev => [...prev, ...newReactions]);

            setTimeout(() => {
                const ids = newReactions.map(r => r.id);
                setReactions(prev => prev.filter(r => !ids.includes(r.id)));
            }, 8000);
        };

        const handleCustom = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.emoji) {
                addShower(customEvent.detail.emoji);
            }
        };
        window.addEventListener('retro-reaction', handleCustom);

        // Polling Logic Optimized
        const boardId = window.location.pathname.split('/').pop();
        let lastTimestamp = Date.now();

        const pollInterval = setInterval(async () => {
            if (document.hidden) return;
            if (!boardId || !boardId.match(/^[0-9a-f-]+$/)) return;

            try {
                const res = await fetch(`/api/reactions?boardId=${boardId}&since=${lastTimestamp}`, { cache: 'no-store' });
                if (res.ok) {
                    const newEvents = await res.json();
                    if (newEvents.length > 0) {
                        let maxTs = lastTimestamp;
                        const myId = currentUserId; // capture from closure

                        newEvents.forEach((evt: any) => {
                            // Deduplicate local echo
                            // If I sent it, I already saw it via handleCustom.
                            // Check userId and timestamp.
                            // Ideally we trust currentUserId is set.
                            // If currentUserId is null (not loaded yet), we might double show. Rare.
                            // Also check if timestamp is recent (> 5s ago means it's old, show it? No, 'since' handles old).
                            // If timestamp is VERY recent (< 5s) AND it's ME, skip.
                            if (currentUserId && evt.userId === currentUserId && (Date.now() - evt.timestamp < 5000)) {
                                // Skip my own recent echo
                            } else {
                                addShower(evt.emoji);
                            }

                            if (evt.timestamp > maxTs) maxTs = evt.timestamp;
                        });
                        lastTimestamp = maxTs;
                    }
                }
            } catch (err) {
                // silent fail
            }
        }, 5000);

        return () => {
            window.removeEventListener('retro-reaction', handleCustom);
            clearInterval(pollInterval);
        };
    }, [currentUserId]); // Re-bind when user ID loads

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            <AnimatePresence>
                {reactions.map(r => {
                    const isDevice = r.emoji === 'vozol';
                    const isSmoke = r.emoji === 'smoke';

                    // Animation Variants
                    let animateState: any = {};
                    let initial: any = {};

                    if (isDevice) {
                        // Blur In/Out at Center
                        initial = { opacity: 0, scale: 0.8, x: '-50%', y: '40vh', filter: 'blur(12px)' };
                        animateState = {
                            opacity: [0, 1, 1, 0],
                            filter: ['blur(12px)', 'blur(0px)', 'blur(0px)', 'blur(12px)'],
                            scale: 1.5,
                            x: '-50%',
                            y: '40vh' // Stay
                        };
                    } else if (isSmoke) {
                        initial = { opacity: 0, y: `${r.yStart}vh`, x: 0, scale: 0.1 };
                        animateState = {
                            opacity: [0, 0.7, 0],
                            y: '-10vh',
                            x: `${r.sway}vw`,
                            scale: 6
                        };
                    } else {
                        // Standard Confetti
                        initial = { opacity: 1, y: `${r.yStart}vh`, x: 0, rotate: 0, scale: 0.8 };
                        animateState = {
                            opacity: [1, 1, 0],
                            y: '120vh',
                            x: `${r.sway}vw`,
                            rotate: r.rotate,
                        };
                    }

                    return (
                        <motion.div
                            key={r.id}
                            id={isDevice ? 'vozol-device-active' : undefined} // For singleton check
                            initial={initial}
                            animate={animateState}
                            transition={{
                                duration: r.duration,
                                ease: isDevice ? "circOut" : "easeOut",
                                delay: r.delay,
                                times: isDevice ? [0, 0.2, 0.8, 1] : undefined
                            }}
                            className="absolute will-change-transform"
                            style={{ left: `${r.x}%` }}
                        >
                            {getReactionIcon(r.emoji)}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
