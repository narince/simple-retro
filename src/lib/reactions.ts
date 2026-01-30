import confetti from 'canvas-confetti';

export type ReactionType = 'fire' | 'celebrate' | 'love' | 'thumbsup' | 'cry' | 'applause' | 'rocket' | 'bulb' | 'star' | 'gem';

export const triggerVisualReaction = (type: ReactionType) => {
    const duration = 2000;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    if (type === 'fire') {
        const animationEnd = Date.now() + 1000;
        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            // Intense fire from bottom center
            confetti({
                particleCount: 8,
                spread: 30, // Narrow spread like a flame
                origin: { x: 0.5, y: 1 },
                startVelocity: 40,
                colors: ['#ef4444', '#f97316', '#fbbf24'], // Red, Orange, Amber
                shapes: ['circle', 'square'], // Embers
                scalar: 1,
                drift: 0,
                ticks: 60,
                gravity: 0.5,
                decay: 0.94
            });
        }, 50);

    } else if (type === 'love') {
        // ... (keep same)
        const duration = 1500;
        const end = Date.now() + duration;

        (function frame() {
            // Hearts
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 1 },
                colors: ['#ec4899', '#f43f5e'],
                shapes: ['circle'],
                scalar: 2
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 1 },
                colors: ['#ec4899', '#f43f5e'],
                shapes: ['circle'],
                scalar: 2
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    } else if (type === 'thumbsup') {
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#3b82f6', '#22c55e'], // Blue and Green
            shapes: ['square'],
            scalar: 1.2
        });
    } else if (type === 'cry') {
        // Rain / Tears
        const end = Date.now() + 2000;
        (function frame() {
            confetti({
                particleCount: 5,
                origin: { x: Math.random(), y: -0.1 }, // Top
                colors: ['#60a5fa', '#93c5fd', '#bfdbfe'], // Blues
                gravity: 2.5, // Heavy
                scalar: 0.8,
                drift: 0,
                startVelocity: 0,
                ticks: 300,
                shapes: ['circle']
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    } else if (type === 'applause') {
        // Gold and Silver confetti from bottom corners
        const end = Date.now() + 1500;
        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#fbbf24', '#fcd34d', '#e5e7eb'], // Gold, Silver
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#fbbf24', '#fcd34d', '#e5e7eb'],
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    } else if (type === 'rocket') {
        // Upward burst from center
        confetti({
            particleCount: 150,
            spread: 10,
            origin: { y: 1 },
            startVelocity: 60,
            colors: ['#ef4444', '#e2e8f0'], // Red and White
            gravity: 0.2,
            ticks: 100
        });
    } else if (type === 'bulb') {
        // Idea / Light: Center burst of yellow/white
        confetti({
            particleCount: 100,
            spread: 360,
            origin: { x: 0.5, y: 0.4 },
            colors: ['#fef08a', '#ffffff', '#eab308'], // Yellows
            startVelocity: 20,
            gravity: 0,
            ticks: 50,
            scalar: 1.2
        });
    } else if (type === 'star') {
        // Stars everywhere
        const end = Date.now() + 1000;
        (function frame() {
            confetti({
                particleCount: 5,
                angle: 90,
                spread: 360,
                origin: { x: Math.random(), y: Math.random() - 0.2 },
                colors: ['#fbbf24', '#f59e0b'],
                shapes: ['star'],
                scalar: 1.5,
                startVelocity: 15
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    } else if (type === 'gem') {
        // Premium feel: Blue/Purple/Cyan
        confetti({
            particleCount: 100,
            spread: 160,
            origin: { y: 0.6 },
            colors: ['#8b5cf6', '#3b82f6', '#06b6d4'],
            shapes: ['square'], // "Gems"
            scalar: 1.2,
            flat: true
        });
    } else {
        // Celebrate (Default)
        confetti({
            particleCount: 150,
            spread: 120,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            shapes: ['star', 'circle', 'square'],
        });
    }
};

export const broadcastReaction = (type: ReactionType) => {
    // Show locally
    triggerVisualReaction(type);

    // Broadcast via localStorage (This only works for same browser tabs)
    localStorage.setItem('reaction-event', JSON.stringify({
        type,
        timestamp: Date.now(),
        id: Math.random().toString(36).substring(7)
    }));

    // TODO: Implement Real-time broadcast using Database/Supabase if needed for cross-device support
};
