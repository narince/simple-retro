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
        const rocket = document.createElement('div');
        rocket.textContent = '🚀';
        rocket.style.position = 'fixed';
        rocket.style.left = '50%';
        rocket.style.top = '50%';
        rocket.style.transform = 'translate(-50%, -50%) scale(0.5)';
        rocket.style.fontSize = '80px';
        rocket.style.opacity = '0';
        rocket.style.transition = 'all 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        rocket.style.zIndex = '9999';
        rocket.style.pointerEvents = 'none';
        rocket.style.filter = 'drop-shadow(0 0 20px rgba(255,100,0,0.5))'; // Glow
        document.body.appendChild(rocket);

        // Use Web Animation API for reliable performance
        const animation = rocket.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.1 }, // Appear quickly
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1, offset: 0.4 }, // Hover/Prepare
            { transform: 'translate(-50%, -50%) scale(8)', opacity: 0, offset: 1 } // Zoom out into face
        ], {
            duration: 2500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });

        // Fire effect - MORE INTENSE ("Bolca")
        const fireDuration = 2000;
        const fireEnd = Date.now() + fireDuration;

        const fireInterval = setInterval(() => {
            const timeLeft = fireEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(fireInterval);

            // Fire particles generated from the center (behind the rocket)
            confetti({
                particleCount: 25, // Increased from 15
                startVelocity: 35, // Faster
                spread: 60, // Wider exhaust
                origin: { x: 0.5, y: 0.55 },
                colors: ['#ef4444', '#f97316', '#fbbf24', '#ffffff', '#ffff00'], // Added bright yellow
                shapes: ['circle', 'square'],
                scalar: 1,
                gravity: 1, // Fall faster
                drift: 0,
                ticks: 50,
                zIndex: 9998
            });
        }, 30); // Faster frequency (30ms)

        animation.onfinish = () => {
            if (rocket.parentNode) rocket.parentNode.removeChild(rocket);
        };
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
