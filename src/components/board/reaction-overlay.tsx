'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Flame, ThumbsUp, PartyPopper, Star, Zap } from "lucide-react";
import { dataService } from "@/services";
import { triggerVisualReaction, ReactionType } from '@/lib/reactions';

// Helper to map emoji/key to Icon component
const getReactionIcon = (emoji: string) => {
    switch (emoji) {
        case '❤️': return <Heart className="w-12 h-12 fill-red-600 text-red-600 drop-shadow-xl filter" />;
        case '🔥': return <Flame className="w-12 h-12 fill-orange-500 text-orange-600 drop-shadow-xl filter" />;
        case '👍': return <ThumbsUp className="w-12 h-12 fill-blue-600 text-blue-700 drop-shadow-xl filter" />;
        case '🎉': return <PartyPopper className="w-12 h-12 text-yellow-500 drop-shadow-xl filter" />;
        case '⭐': return <Star className="w-12 h-12 fill-yellow-400 text-yellow-600 drop-shadow-xl filter" />;
        case '⚡': return <Zap className="w-12 h-12 fill-yellow-400 text-yellow-600 drop-shadow-xl filter" />;
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
    const [activeGif, setActiveGif] = useState<{ id: string; url: string; sender: string } | null>(null);
    const processedIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        dataService.getCurrentUser().then(u => setCurrentUserId(u?.id || null));
    }, []);

    useEffect(() => {
        const addShower = (emoji: string) => {
            // Check for GIF
            if (emoji.startsWith('GIF|')) {
                const parts = emoji.split('|');
                // Format: GIF|url|sender
                const url = parts[1];
                const sender = parts[2] || 'Anonymous';
                const gifId = Math.random().toString();

                setActiveGif({ id: gifId, url, sender });

                // Auto dismiss after 6 seconds
                setTimeout(() => {
                    setActiveGif(current => current?.id === gifId ? null : current);
                }, 6000);
                return;
            }

            // Map Emoji to Special Reaction Type
            const SPECIAL_MAP: Record<string, ReactionType> = {
                '👏': 'applause',
                '🚀': 'rocket',
                '💡': 'bulb',
                '⭐': 'star'
            };

            const specialType = SPECIAL_MAP[emoji];
            if (specialType) {
                // Trigger the sophisticated center animation
                triggerVisualReaction(specialType);
                return;
            }

            const count = 100;
            const newReactions: Reaction[] = [];
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

            setReactions(prev => [...prev, ...newReactions]);

            setTimeout(() => {
                const ids = newReactions.map(r => r.id);
                setReactions(prev => prev.filter(r => !ids.includes(r.id)));
            }, 5000);
        };

        const handleCustom = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.emoji) {
                // If ID is present, track it
                if (customEvent.detail.id) {
                    if (processedIdsRef.current.has(customEvent.detail.id)) return;
                    processedIdsRef.current.add(customEvent.detail.id);
                }
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

                        newEvents.forEach((evt: any) => {
                            // Deduplicate by ID if available
                            if (evt.id && processedIdsRef.current.has(evt.id)) {
                                return;
                            }
                            // Also fallback to check user ID double echo if ID not present (legacy)
                            if (currentUserId && evt.user_id === currentUserId && (Date.now() - evt.timestamp < 5000)) {
                                // Skip recent echo
                            } else {
                                if (evt.id) processedIdsRef.current.add(evt.id);
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
        }, 3000); // 3s polling

        return () => {
            window.removeEventListener('retro-reaction', handleCustom);
            clearInterval(pollInterval);
        };
    }, [currentUserId]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            <AnimatePresence>
                {/* GIF Overlay - Twitch Method */}
                {activeGif && (
                    <motion.div
                        key="gif-overlay"
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 bg-black/60 p-4 rounded-xl border border-white/20 backdrop-blur-md shadow-2xl max-w-sm pointer-events-auto"
                    >
                        <div className="rounded-lg overflow-hidden border-2 border-white/30 shadow-lg">
                            <img src={activeGif.url} className="max-h-64 object-contain" alt="Reaction GIF" />
                        </div>
                        <div className="text-white font-bold text-shadow-sm flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full">
                            <span className="text-blue-400">{activeGif.sender}</span>
                            <span>sent a GIF!</span>
                        </div>
                    </motion.div>
                )}

                {/* Confetti */}
                {reactions.map(r => {
                    // Standard Confetti Animation
                    const initial = { opacity: 1, y: `${r.yStart}vh`, x: 0, rotate: 0, scale: 0.8 };
                    const animateState = {
                        opacity: [1, 1, 0],
                        y: '120vh',
                        x: `${r.sway}vw`,
                        rotate: r.rotate,
                    };

                    return (
                        <motion.div
                            key={r.id}
                            initial={initial}
                            animate={animateState}
                            transition={{
                                duration: r.duration,
                                ease: "easeOut",
                                delay: r.delay,
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
