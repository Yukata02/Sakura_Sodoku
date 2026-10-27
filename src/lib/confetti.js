// NovaSudoku Celebration Confetti Effect

export function launchConfetti() {
    try {
        let canvas = document.getElementById('nova-confetti-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'nova-confetti-canvas';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);
        }

        const width = (canvas.width = window.innerWidth);
        const height = (canvas.height = window.innerHeight);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];
        const particles = [];
        const count = 120;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: width * 0.5 + (Math.random() - 0.5) * 200,
                y: height * 0.4 + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.8) * 18,
                size: Math.random() * 8 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 12,
                opacity: 1,
            });
        }

        const startTime = Date.now();
        const duration = 3500;

        function render() {
            const elapsed = Date.now() - startTime;
            if (elapsed > duration) {
                ctx.clearRect(0, 0, width, height);
                if (canvas && canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
                return;
            }

            ctx.clearRect(0, 0, width, height);
            const fade = Math.max(0, 1 - (elapsed / duration));

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.38; // gravity
                p.vx *= 0.985;
                p.rotation += p.vRot;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity * fade;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            }

            requestAnimationFrame(render);
        }

        render();
    } catch {
        // ignore if canvas is unsupported
    }
}
