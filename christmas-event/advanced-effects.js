/* ===================================
   NORTHERN LIGHTS - Aurora Borealis
   Animated pixel art background effect
   =================================== */

class NorthernLights {
    constructor(canvas) {
        this.canvas = canvas;
        this.waves = [];
        this.initWaves();
    }

    initWaves() {
        // Create multiple wave layers for depth
        const colors = [
            { r: 0, g: 255, b: 150, alpha: 0.15 },  // Green
            { r: 100, g: 200, b: 255, alpha: 0.12 }, // Blue
            { r: 200, g: 100, b: 255, alpha: 0.10 }  // Purple
        ];

        colors.forEach((color, index) => {
            const y = 80 + index * 30;

            // Pre-create gradient for aurora effect
            const gradient = this.canvas.getContext('2d').createLinearGradient(0, y - 50, 0, y + 100);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

            this.waves.push({
                color: color,
                gradient: gradient, // Cached
                points: [],
                offset: index * 100,
                speed: 0.01 + index * 0.005,
                amplitude: 40 + index * 20,
                frequency: 0.01 + index * 0.002,
                y: y
            });

            // Initialize wave points
            for (let x = 0; x <= this.canvas.width + 50; x += 10) {
                this.waves[index].points.push({
                    x: x,
                    baseY: y,
                    currentY: y
                });
            }
        });
    }

    update() {
        this.waves.forEach(wave => {
            wave.offset += wave.speed;

            // Update each point in the wave
            wave.points.forEach((point, i) => {
                const waveValue = Math.sin(wave.offset + i * wave.frequency) * wave.amplitude;
                point.currentY = point.baseY + waveValue;
            });
        });
    }

    draw(ctx) {
        ctx.save();

        this.waves.forEach(wave => {
            ctx.fillStyle = wave.gradient; // Use cached gradient
            ctx.beginPath();
            ctx.moveTo(0, this.canvas.height);

            // Draw wave
            wave.points.forEach(point => {
                ctx.lineTo(point.x, point.currentY);
            });

            ctx.lineTo(this.canvas.width, this.canvas.height);
            ctx.closePath();
            ctx.fill();
        });

        ctx.restore();
    }
}

/* ===================================
   TWINKLING STARS
   Pixel art star field with parallax
   =================================== */

class StarField {
    constructor(canvas) {
        this.canvas = canvas;
        this.stars = [];
        this.initStars();
    }

    initStars() {
        const starCount = 100;

        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 300, // Upper half of screen
                size: Math.random() < 0.7 ? 2 : 3, // Mostly small stars
                brightness: Math.random(),
                twinkleSpeed: 0.02 + Math.random() * 0.03,
                layer: Math.random() < 0.5 ? 1 : 2 // Parallax layers
            });
        }
    }

    update(gameSpeed) {
        this.stars.forEach(star => {
            // Twinkle effect
            star.brightness += star.twinkleSpeed;
            if (star.brightness > 1 || star.brightness < 0) {
                star.twinkleSpeed *= -1;
            }

            // Parallax scrolling
            if (gameSpeed) {
                star.x -= gameSpeed * (star.layer === 1 ? 0.2 : 0.4);

                // Wrap around
                if (star.x < 0) {
                    star.x = this.canvas.width;
                    star.y = Math.random() * 300;
                }
            }
        });
    }

    draw(ctx) {
        ctx.save();

        this.stars.forEach(star => {
            const alpha = 0.5 + star.brightness * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

            // Draw star as pixel
            ctx.fillRect(
                Math.floor(star.x),
                Math.floor(star.y),
                star.size,
                star.size
            );

            // Add glow for larger stars
            if (star.size === 3) {
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillRect(
                    Math.floor(star.x - 1),
                    Math.floor(star.y - 1),
                    star.size + 2,
                    star.size + 2
                );
                ctx.globalAlpha = 1;
            }
        });

        ctx.restore();
    }
}

/* ===================================
   SCREEN SHAKE
   Satisfying camera shake effect
   =================================== */

let screenShake = 0;

function updateScreenShake() {
    if (screenShake > 0) {
        screenShake *= 0.9;
        if (screenShake < 0.1) screenShake = 0;
    }
}

function getShakeOffset() {
    if (screenShake === 0) return { x: 0, y: 0 };

    return {
        x: (Math.random() - 0.5) * screenShake,
        y: (Math.random() - 0.5) * screenShake
    };
}

/* ===================================
   PIXEL-PERFECT RENDERING
   Disable anti-aliasing for crisp pixels
   =================================== */

function enablePixelPerfect(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

// Initialize systems
let northernLights = null;
let starField = null;

function initAdvancedEffects(canvas) {
    if (window.CHRISTMAS_MODE) {
        northernLights = new NorthernLights(canvas);
        starField = new StarField(canvas);
        console.log('✨ Advanced Effects Loaded!');
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NorthernLights,
        StarField,
        initAdvancedEffects,
        updateScreenShake,
        getShakeOffset,
        enablePixelPerfect
    };
}
