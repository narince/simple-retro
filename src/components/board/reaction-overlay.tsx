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
    const processedIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        dataService.getCurrentUser().then(u => setCurrentUserId(u?.id || null));
    }, []);

    useEffect(() => {
        const addShower = (emoji: string) => {
            // Check for Special Center Reactions
            const specials = ['applause', 'rocket', 'bulb', 'star', 'gem'];
            if (specials.includes(emoji)) {
                // Trigger the sophisticated center animation
                triggerVisualReaction(emoji as ReactionType);
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
        }, 5000);

        return () => {
            window.removeEventListener('retro-reaction', handleCustom);
            clearInterval(pollInterval);
        };
    }, [currentUserId]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            <AnimatePresence>
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
