/* ===================================
   CHRISTMAS GAME FEATURES
   Presents, Power-ups, Combo System, Christmas Lights
   =================================== */

// ============ PRESENT COLLECTIBLES ============

class Present {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'red', 'green', 'blue'
        this.width = 24;
        this.height = 24;
        this.collected = false;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.sparkles = [];

        const config = window.christmasConfig?.scoring || {};
        this.points = type === 'blue' ? (config.bluePresentPoints || 5) :
            type === 'green' ? (config.greenPresentPoints || 3) :
                (config.redPresentPoints || 1);
    }

    update() {
        // Bob up and down
        this.bobPhase += 0.1;
        this.bobOffset = Math.sin(this.bobPhase) * 4;

        // Create sparkles
        if (Math.random() < 0.3) {
            this.sparkles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                life: 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2
            });
        }

        // Update sparkles
        this.sparkles = this.sparkles.filter(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.life--;
            return s.life > 0;
        });
    }

    draw(ctx) {
        const y = this.y + this.bobOffset;

        // Draw sparkles
        this.sparkles.forEach(s => {
            ctx.fillStyle = '#FFD700';
            ctx.globalAlpha = s.life / 20;
            ctx.fillRect(s.x, s.y, 2, 2);
            ctx.globalAlpha = 1;
        });

        // Present box color
        const colors = {
            red: '#E31C23',
            green: '#0F7D3A',
            blue: '#4169E1'
        };

        // Box
        ctx.fillStyle = colors[this.type];
        ctx.fillRect(this.x, y, this.width, this.height);

        // Box outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, y, this.width, this.height);

        // Ribbon horizontal
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x, y + this.height / 2 - 2, this.width, 4);

        // Ribbon vertical
        ctx.fillRect(this.x + this.width / 2 - 2, y, 4, this.height);

        // Bow on top
        this.drawBow(ctx, this.x + this.width / 2, y - 4);

        // Point value indicator
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.strokeText(`+${this.points}`, this.x + this.width / 2, y - 8);
        ctx.fillText(`+${this.points}`, this.x + this.width / 2, y - 8);
    }

    drawBow(ctx, x, y) {
        ctx.fillStyle = '#FFD700';

        // Left loop
        ctx.beginPath();
        ctx.arc(x - 4, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Right loop
        ctx.beginPath();
        ctx.arc(x + 4, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Center knot
        ctx.fillRect(x - 2, y - 2, 4, 4);
    }

    checkCollision(bird) {
        return !this.collected &&
            bird.x < this.x + this.width &&
            bird.x + bird.width > this.x &&
            bird.y < this.y + this.height &&
            bird.y + bird.height > this.y;
    }
}

// Present manager
const presentManager = {
    presents: [],
    spawnTimer: 0,
    totalCollected: 0,

    get spawnInterval() {
        return window.christmasConfig?.difficulty?.presentSpawnRate || 180;
    },

    spawn() {
        const x = canvas.width;
        const y = 150 + Math.random() * 200;
        const types = ['red', 'red', 'green', 'blue']; // Blue is rare
        const type = types[Math.floor(Math.random() * types.length)];

        this.presents.push(new Present(x, y, type));
    },

    update(gameSpeed, bird, score) {
        if (gameState !== 'PLAYING') return;

        this.spawnTimer++;

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
        }

        // Update presents
        this.presents = this.presents.filter(p => {
            p.update();
            p.x -= gameSpeed;

            // Check collision with bird
            if (p.checkCollision(bird)) {
                this.collectPresent(p, bird, score);
                return false;
            }

            return p.x > -p.width;
        });
    },

    collectPresent(present, bird, currentScore) {
        // Add bonus points
        if (typeof score !== 'undefined') {
            score += present.points;
        }

        this.totalCollected++;

        // Explosion particles
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 15; i++) {
                particles.push({
                    x: present.x + present.width / 2,
                    y: present.y + present.height / 2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8 - 2,
                    color: present.type === 'red' ? '#E31C23' :
                        present.type === 'green' ? '#0F7D3A' : '#4169E1',
                    size: 4 + Math.random() * 4,
                    life: 30
                });
            }
        }

        // Play sound (with error protection)
        try {
            if (typeof christmasSounds !== 'undefined' && christmasSounds.playPresentCollect) {
                christmasSounds.playPresentCollect();
            }
        } catch (e) {
            console.warn('Could not play present collect sound:', e);
        }
    },

    draw(ctx) {
        this.presents.forEach(p => p.draw(ctx));
    },

    reset() {
        this.presents = [];
        this.spawnTimer = 0;
    }
};

// ============ COMBO SYSTEM ============

class ComboSystem {
    constructor() {
        this.combo = 0;
        this.comboTimer = 0;
        this.multiplier = 1;
    }

    get comboDecay() {
        return window.christmasConfig?.difficulty?.comboDecayTime || 120;
    }

    get comboThreshold() {
        return window.christmasConfig?.scoring?.comboThreshold || 5;
    }

    get multiplierStep() {
        return window.christmasConfig?.scoring?.comboMultiplierStep || 0.5;
    }

    addCombo() {
        this.combo++;
        this.comboTimer = this.comboDecay;

        // Increase multiplier every threshold
        this.multiplier = 1 + Math.floor(this.combo / this.comboThreshold) * this.multiplierStep;

        // Visual feedback
        if (this.combo % this.comboThreshold === 0) {
            this.showComboMilestone();
        }
    }

    update() {
        if (this.combo > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.reset();
            }
        }
    }

    reset() {
        this.combo = 0;
        this.multiplier = 1;
    }

    showComboMilestone() {
        // Create floating text
        if (typeof floatingTexts !== 'undefined' && typeof FloatingText !== 'undefined') {
            floatingTexts.push(new FloatingText(
                `COMBO x${this.combo}!`,
                canvas.width / 2,
                150
            ));
        }

        // Firework burst
        if (typeof particles !== 'undefined') {
            for (let i = 0; i < 20; i++) {
                particles.push({
                    x: canvas.width / 2,
                    y: 150,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    color: ['#E31C23', '#FFD700', '#0F7D3A', '#FFFFFF'][Math.floor(Math.random() * 4)],
                    size: 4,
                    life: 40
                });
            }
        }
    }

    draw(ctx, canvas) {
        if (this.combo > 0) {
            const x = canvas.width - 80;
            const y = 50;

            // Background plate
            ctx.fillStyle = 'rgba(15, 125, 58, 0.8)';
            ctx.fillRect(x - 5, y - 20, 70, 35);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 5, y - 20, 70, 35);

            // "COMBO" text
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('COMBO', x, y - 5);

            // Combo number
            ctx.font = '16px "Press Start 2P"';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`x${this.combo}`, x + 5, y + 12);

            // Timer bar
            const barWidth = 60;
            const timePercent = this.comboTimer / this.comboDecay;
            ctx.fillStyle = timePercent > 0.3 ? '#0F7D3A' : '#E31C23';
            ctx.fillRect(x - 3, y + 18, barWidth * timePercent, 3);
        }
    }
}

const comboSystem = new ComboSystem();

// ============ CHRISTMAS LIGHTS ============

class ChristmasLights {
    constructor(canvas) {
        this.lights = [];
        this.canvas = canvas;
        this.init();
    }

    init() {
        const config = window.christmasConfig?.visuals || { christmasLightsCount: 15 };
        const spacing = this.canvas.width / (config.christmasLightsCount - 1);
        const startY = 40;
        const amplitude = 15;

        for (let i = 0; i < config.christmasLightsCount; i++) {
            const x = i * spacing;
            const progress = x / this.canvas.width;
            const sag = Math.sin(progress * Math.PI) * amplitude;

            this.lights.push({
                x: x,
                y: startY + sag,
                color: this.getRandomLightColor(),
                phase: Math.random() * Math.PI * 2,
                baseIntensity: 0.8 + Math.random() * 0.2
            });
        }
    }

    getRandomLightColor() {
        const colors = [
            '#E31C23',  // Red
            '#FFD700',  // Gold
            '#0F7D3A',  // Green
            '#4169E1',  // Blue
            '#FF69B4',  // Pink
            '#FFA500'   // Orange
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.lights.forEach(light => {
            light.phase += 0.05;
        });
    }

    draw(ctx) {
        // Draw connecting wire
        ctx.strokeStyle = '#2F4F4F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.lights.forEach((light, i) => {
            if (i === 0) ctx.moveTo(light.x, light.y);
            else ctx.lineTo(light.x, light.y);
        });
        ctx.stroke();

        // Draw lights
        this.lights.forEach(light => {
            // Twinkling effect
            const intensity = light.baseIntensity + Math.sin(light.phase) * 0.2;

            ctx.save();
            ctx.globalAlpha = intensity;

            // Light glow
            const gradient = ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, 12
            );
            gradient.addColorStop(0, light.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(light.x, light.y, 12, 0, Math.PI * 2);
            ctx.fill();

            // Light bulb (pixel art)
            ctx.fillStyle = light.color;
            ctx.fillRect(light.x - 3, light.y - 4, 6, 8);

            // Bulb outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(light.x - 3, light.y - 4, 6, 8);

            // Highlight
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(light.x - 1, light.y - 2, 2, 2);

            ctx.restore();
        });
    }
}

let christmasLights = null;

// Initialize Christmas lights
function initChristmasLights(canvas) {
    if (window.christmasConfig?.features?.christmasLights) {
        christmasLights = new ChristmasLights(canvas);
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        presentManager,
        comboSystem,
        ChristmasLights,
        initChristmasLights
    };
}
