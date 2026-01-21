import confetti from 'canvas-confetti';

type ReactionType = 'fire' | 'celebrate' | 'love' | 'thumbsup' | 'cry';

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
        const duration = 1500;
        const end = Date.now() + duration;

        (function frame() {
            // Hearts (Simulated with stars or circles if stars fail, but trying star)
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 1 },
                colors: ['#ec4899', '#f43f5e'],
                shapes: ['star', 'circle'],
                scalar: 2 // Big
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 1 },
                colors: ['#ec4899', '#f43f5e'],
                shapes: ['star', 'circle'],
                scalar: 2
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    } else if (type === 'thumbsup') {
        // ... (keep same)
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#3b82f6', '#22c55e'], // Blue and Green
            shapes: ['square'],
            scalar: 1.2
        });
    } else if (type === 'cry') {
        // ... (keep same)
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
    } else {
        // Celebrate
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

    // Broadcast via localStorage
    localStorage.setItem('reaction-event', JSON.stringify({
        type,
        timestamp: Date.now(),
        id: Math.random().toString(36).substring(7) // Unique ID to force change event
    }));
};
