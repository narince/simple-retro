import confetti from 'canvas-confetti';

export type ReactionType = 'fire' | 'celebrate' | 'love' | 'thumbsup' | 'cry' | 'applause' | 'rocket' | 'bulb' | 'star';

export const triggerVisualReaction = (type: ReactionType) => {
    // Helper for DOM animations centered on screen
    const createCenteredElement = (emoji: string, size = '100px', zIndex = '9999') => {
        const el = document.createElement('div');
        el.textContent = emoji;
        el.style.position = 'fixed';
        el.style.left = '50%';
        el.style.top = '50%';
        el.style.transform = 'translate(-50%, -50%) scale(0)';
        el.style.fontSize = size;
        el.style.zIndex = zIndex;
        el.style.pointerEvents = 'none';
        document.body.appendChild(el);
        return el;
    };

    if (type === 'fire') {
        const animationEnd = Date.now() + 1000;
        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            confetti({
                particleCount: 8,
                spread: 30, // Narrow spread like a flame
                origin: { x: 0.5, y: 1 },
                startVelocity: 40,
                colors: ['#ef4444', '#f97316', '#fbbf24'], // Red, Orange, Amber
                shapes: ['circle'], // Embers (Removed square to look like fire)
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
            // Hearts
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 1 },
                colors: ['#ec4899', '#f43f5e'],
                shapes: ['circle'], // Hearts simulated by circles for performance, or could use shape:'heart' if supported custom
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
        // Floating Claps (Medium-style) - Intensified
        const clapCount = 35; // Increased from 15
        const duration = 2500;

        for (let i = 0; i < clapCount; i++) {
            setTimeout(() => {
                const el = document.createElement('div');
                el.innerText = '👏';
                el.style.position = 'fixed';
                // Wide spread: Start horizontally distributed across 80% of screen center
                const randomX = (Math.random() * 80) + 10; // 10% to 90% vw
                el.style.left = `${randomX}vw`;
                el.style.top = '85%'; // Start slightly lower
                el.style.fontSize = `${Math.floor(Math.random() * 24) + 20}px`; // Random size 20-44px
                el.style.zIndex = '9999';
                el.style.pointerEvents = 'none';
                el.style.userSelect = 'none';
                el.style.opacity = '0';
                document.body.appendChild(el);

                // Random sway direction
                const xSway = (Math.random() - 0.5) * 100; // -50px to +50px sway

                const animation = el.animate([
                    { transform: 'translate(0, 0) scale(0.5)', opacity: 0 },
                    { transform: `translate(${xSway * 0.2}px, -60px) scale(1.2)`, opacity: 1, offset: 0.2 }, // Pop in
                    { transform: `translate(${xSway * 0.5}px, -300px) scale(1)`, opacity: 1, offset: 0.5 }, // Float up
                    { transform: `translate(${xSway}px, -600px) scale(0.8)`, opacity: 0, offset: 1 } // Fade out high
                ], {
                    duration: duration + Math.random() * 1000,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    fill: 'forwards'
                });

                animation.onfinish = () => el.remove();
            }, i * 30); // Faster stagger for bigger burst feel
        }

    } else if (type === 'rocket') {
        const rocket = createCenteredElement('🚀', '100px');
        rocket.style.filter = 'drop-shadow(0 0 20px rgba(255,100,0,0.5))';

        const animation = rocket.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.1 },
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1, offset: 0.3 }, // Hover
            { transform: 'translate(-50%, -50%) scale(8)', opacity: 0, offset: 1 } // Zoom out to face
        ], { duration: 3500, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' });

        // Fire Trail - PURE Circles, No debris falling from top
        const fireDuration = 3000;
        const fireEnd = Date.now() + fireDuration;

        const fireInterval = setInterval(() => {
            const timeLeft = fireEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(fireInterval);

            confetti({
                particleCount: 50,
                startVelocity: 45,
                spread: 70,
                origin: { x: 0.5, y: 0.55 },
                colors: ['#ef4444', '#f97316', '#fbbf24', '#ffffff'],
                shapes: ['circle'], // STRICTLY CIRCLES
                scalar: 1,
                gravity: 1,
                drift: 0,
                ticks: 60,
                zIndex: 9998
            });
        }, 30);

        animation.onfinish = () => rocket.remove();

    } else if (type === 'bulb') {
        // Bulb: Center, Zoom In, Blink
        const bulb = createCenteredElement('💡', '120px');
        bulb.style.filter = 'drop-shadow(0 0 30px rgba(253, 224, 71, 0.8))'; // Glow

        const animation = bulb.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 0, offset: 0 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.2 }, // Arrive
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 0.5, offset: 0.3 }, // Blink dim
            { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 1, offset: 0.4 }, // Blink bright
            { transform: 'translate(-50%, -50%) scale(1.4)', opacity: 0.5, offset: 0.5 }, // Blink dim
            { transform: 'translate(-50%, -50%) scale(3)', opacity: 0, offset: 1 } // Zoom out
        ], { duration: 2500, easing: 'ease-out', fill: 'forwards' });

        animation.onfinish = () => bulb.remove();

    } else if (type === 'star') {
        // Star: Dark Background + Center Star Zoom + Blink
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        overlay.style.zIndex = '9998';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s';
        document.body.appendChild(overlay);

        // Trigger fade in
        requestAnimationFrame(() => overlay.style.opacity = '1');

        const star = createCenteredElement('⭐', '150px', '9999');
        star.style.filter = 'drop-shadow(0 0 40px rgba(255, 215, 0, 0.9))';

        const animation = star.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 0, offset: 0 },
            { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1, offset: 0.2 },
            { transform: 'translate(-50%, -50%) scale(1.2) rotate(45deg)', opacity: 0.8, offset: 0.4 },
            { transform: 'translate(-50%, -50%) scale(1) rotate(90deg)', opacity: 1, offset: 0.6 },
            { transform: 'translate(-50%, -50%) scale(1.5) rotate(180deg)', opacity: 0.8, offset: 0.8 },
            { transform: 'translate(-50%, -50%) scale(4) rotate(360deg)', opacity: 0, offset: 1 }
        ], { duration: 3000, easing: 'ease-out', fill: 'forwards' });

        animation.onfinish = () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
            star.remove();
        };



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
