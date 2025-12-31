/* ===================================
   STREAK SYSTEM - Addictive Gameplay
   Consecutive pipes = Higher multiplier
   =================================== */

class StreakSystem {
    constructor() {
        this.currentStreak = 0;
        this.bestStreak = this.loadBestStreak();
        this.multiplier = 1.0;
        this.celebrationActive = false;
        this.celebrationTimer = 0;
        this.milestoneReached = null;
        this.fireworks = [];
        this.streakPulse = 0;
        this.comboText = [];
    }

    loadBestStreak() {
        const saved = localStorage.getItem('christmas_best_streak');
        return saved ? parseInt(saved) : 0;
    }

    saveBestStreak() {
        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
            localStorage.setItem('christmas_best_streak', this.bestStreak.toString());
        }
    }

    addPipe() {
        this.currentStreak++;
        this.saveBestStreak();

        // Calculate multiplier (increases every 5 pipes)
        this.multiplier = 1.0 + Math.floor(this.currentStreak / 5) * 0.5;

        // Pulse animation
        this.streakPulse = 1.0;

        // Check for milestones
        this.checkMilestone();

        // Add combo text
        if (this.currentStreak >= 5) {
            this.addComboText();
        }
    }

    checkMilestone() {
        const milestones = [10, 25, 50, 75, 100];

        if (milestones.includes(this.currentStreak)) {
            this.triggerCelebration(this.currentStreak);
        }
    }

    triggerCelebration(milestone) {
        this.celebrationActive = true;
        this.celebrationTimer = 120; // 2 seconds at 60fps
        this.milestoneReached = milestone;

        // Create fireworks
        this.createFireworks(milestone);

        // Screen shake
        if (typeof screenShake !== 'undefined') {
            screenShake = 15;
        }

        // Play celebration sound
        if (typeof christmasSounds !== 'undefined' && christmasSounds.playSleighBells) {
            christmasSounds.playSleighBells();
        }
    }

    createFireworks(count) {
        const colors = ['#E31C23', '#FFD700', '#0F7D3A', '#4169E1', '#FFFFFF'];

        for (let i = 0; i < count / 5; i++) {
            setTimeout(() => {
                const x = Math.random() * canvas.width;
                const y = 100 + Math.random() * 200;

                // Burst of particles
                for (let j = 0; j < 30; j++) {
                    const angle = (Math.PI * 2 / 30) * j;
                    const speed = 3 + Math.random() * 5;

                    this.fireworks.push({
                        x: x,
                        y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        life: 60,
                        maxLife: 60,
                        size: 3 + Math.random() * 3,
                        gravity: 0.1
                    });
                }
            }, i * 200);
        }
    }

    addComboText() {
        const messages = [
            'NICE!',
            'GREAT!',
            'AWESOME!',
            'AMAZING!',
            'INCREDIBLE!',
            'LEGENDARY!'
        ];

        const index = Math.min(Math.floor(this.currentStreak / 10), messages.length - 1);

        this.comboText.push({
            text: messages[index],
            x: canvas.width / 2,
            y: 150,
            life: 60,
            maxLife: 60,
            scale: 0
        });
    }

    reset() {
        this.currentStreak = 0;
        this.multiplier = 1.0;
        this.celebrationActive = false;
        this.celebrationTimer = 0;
        this.milestoneReached = null;
        this.fireworks = [];
        this.comboText = [];
    }

    update() {
        // Update pulse
        if (this.streakPulse > 0) {
            this.streakPulse -= 0.05;
        }

        // Update celebration timer
        if (this.celebrationTimer > 0) {
            this.celebrationTimer--;
            if (this.celebrationTimer === 0) {
                this.celebrationActive = false;
                this.milestoneReached = null;
            }
        }

        // Update fireworks
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const fw = this.fireworks[i];
            fw.x += fw.vx;
            fw.y += fw.vy;
            fw.vy += fw.gravity;
            fw.life--;

            if (fw.life <= 0) {
                this.fireworks.splice(i, 1);
            }
        }

        // Update combo text
        for (let i = this.comboText.length - 1; i >= 0; i--) {
            const ct = this.comboText[i];
            ct.life--;
            ct.y -= 1;

            // Scale animation
            if (ct.scale < 1) {
                ct.scale += 0.1;
            }

            if (ct.life <= 0) {
                this.comboText.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Draw streak counter (top right)
        if (this.currentStreak > 0) {
            const x = canvas.width - 100;
            const y = 50;
            const pulse = 1 + this.streakPulse * 0.2;

            ctx.save();
            ctx.translate(x, y);
            ctx.scale(pulse, pulse);

            // Background
            const bgColor = this.getStreakColor();
            ctx.fillStyle = bgColor;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(-45, -25, 90, 50);

            // Border
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1;
            ctx.strokeRect(-45, -25, 90, 50);

            // Streak icon (fire emoji style)
            ctx.fillStyle = '#FF6B00';
            ctx.fillRect(-35, -10, 8, 12);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-32, -15, 5, 8);

            // Streak number
            ctx.font = 'bold 20px "Press Start 2P"';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.currentStreak.toString(), 5, 0);

            // Multiplier
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`x${this.multiplier.toFixed(1)}`, 5, 15);

            ctx.restore();
        }

        // Draw fireworks
        this.fireworks.forEach(fw => {
            const alpha = fw.life / fw.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = fw.color;
            ctx.fillRect(fw.x - fw.size / 2, fw.y - fw.size / 2, fw.size, fw.size);

            // Glow effect
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillRect(fw.x - fw.size, fw.y - fw.size, fw.size * 2, fw.size * 2);
            ctx.restore();
        });

        // Draw combo text
        this.comboText.forEach(ct => {
            const alpha = ct.life / ct.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(ct.x, ct.y);
            ctx.scale(ct.scale, ct.scale);

            // Shadow
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 24px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ct.text, 2, 2);

            // Text
            ctx.fillStyle = '#FFD700';
            ctx.fillText(ct.text, 0, 0);

            ctx.restore();
        });

        // Draw milestone celebration
        if (this.celebrationActive && this.milestoneReached) {
            const alpha = this.celebrationTimer / 120;
            const scale = 1 + (1 - alpha) * 0.5;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scale, scale);

            // Background flash
            ctx.fillStyle = '#FFD700';
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2);

            // Milestone text
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 32px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Shadow
            ctx.fillStyle = '#000000';
            ctx.fillText(`${this.milestoneReached} PIPES!`, 3, 3);

            // Text
            ctx.fillStyle = '#E31C23';
            ctx.fillText(`${this.milestoneReached} PIPES!`, 0, 0);

            // Subtitle
            ctx.font = '16px "Press Start 2P"';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('AMAZING!', 0, 40);

            ctx.restore();
        }
    }

    getStreakColor() {
        if (this.currentStreak >= 50) return '#9B59B6'; // Purple
        if (this.currentStreak >= 25) return '#E31C23'; // Red
        if (this.currentStreak >= 10) return '#FF6B00'; // Orange
        return '#0F7D3A'; // Green
    }

    getMultiplier() {
        return this.multiplier;
    }

    getCurrentStreak() {
        return this.currentStreak;
    }

    getBestStreak() {
        return this.bestStreak;
    }
}

// Initialize streak system
const streakSystem = new StreakSystem();

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = streakSystem;
}

console.log('🔥 Streak System Loaded!');
