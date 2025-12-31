/* ===================================
   SNOW PARTICLE SYSTEM
   Multi-layer realistic snowfall
   =================================== */

class SnowParticle {
    constructor(layer, canvasWidth, canvasHeight) {
        this.layer = layer; // 1=far, 2=mid, 3=close
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = -10;

        // Layer determines size and speed
        if (this.layer === 1) {
            // Far layer (background snow)
            this.size = 2;
            this.speed = 0.5 + Math.random() * 0.5;
            this.opacity = 0.3;
            this.drift = 0.2;
        } else if (this.layer === 2) {
            // Mid layer
            this.size = 3;
            this.speed = 1 + Math.random();
            this.opacity = 0.6;
            this.drift = 0.5;
        } else {
            // Close layer (foreground snow)
            this.size = 4 + Math.floor(Math.random() * 2);
            this.speed = 1.5 + Math.random() * 1.5;
            this.opacity = 0.9;
            this.drift = 1;
        }

        this.driftOffset = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 2;
        this.rotation = 0;
    }

    update() {
        this.y += this.speed;

        // Gentle horizontal drift (wind effect)
        this.x += Math.sin(Date.now() / 1000 + this.driftOffset) * this.drift;

        // Rotation
        this.rotation += this.rotationSpeed;

        // Reset when off screen
        if (this.y > this.canvasHeight + 10) {
            this.reset();
        }

        // Wrap horizontal
        if (this.x < -10) this.x = this.canvasWidth + 10;
        if (this.x > this.canvasWidth + 10) this.x = -10;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.opacity;

        // Snowflake shape (pixel perfect)
        ctx.fillStyle = '#FFFFFF';

        if (this.size <= 2) {
            // Small snowflake (single pixel)
            ctx.fillRect(-1, -1, 2, 2);
        } else if (this.size <= 3) {
            // Medium snowflake (plus shape)
            ctx.fillRect(-1, -this.size / 2, 2, this.size);
            ctx.fillRect(-this.size / 2, -1, this.size, 2);
        } else {
            // Large snowflake (detailed 6-point)
            this.drawDetailedFlake(ctx, this.size);
        }

        ctx.restore();
    }

    drawDetailedFlake(ctx, size) {
        // 6-pointed snowflake (pixel art)
        const points = 6;

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E6F3FF';
        ctx.lineWidth = 1;

        // Center
        ctx.fillRect(-1, -1, 2, 2);

        for (let i = 0; i < points; i++) {
            const angle = (Math.PI * 2 / points) * i;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;

            // Main spike
            ctx.fillRect(x - 1, y - 1, 2, 2);

            // Branch at 60% distance
            const branchX = Math.cos(angle) * (size * 0.6);
            const branchY = Math.sin(angle) * (size * 0.6);
            ctx.fillRect(branchX - 1, branchY - 1, 2, 2);
        }
    }
}

// Snow System Manager
const snowSystem = {
    particles: [],
    canvas: null,

    init(canvas) {
        this.canvas = canvas;
        this.particles = [];

        const config = window.christmasConfig?.visuals || { snowParticleCount: 150 };
        const totalCount = config.snowParticleCount;

        // Distribute across layers: 50 far, 60 mid, 40 close
        const farCount = Math.floor(totalCount * 0.33);
        const midCount = Math.floor(totalCount * 0.40);
        const closeCount = totalCount - farCount - midCount;

        for (let i = 0; i < farCount; i++) {
            this.particles.push(new SnowParticle(1, canvas.width, canvas.height));
        }
        for (let i = 0; i < midCount; i++) {
            this.particles.push(new SnowParticle(2, canvas.width, canvas.height));
        }
        for (let i = 0; i < closeCount; i++) {
            this.particles.push(new SnowParticle(3, canvas.width, canvas.height));
        }

        // Spread initial positions across screen
        this.particles.forEach(p => {
            p.y = Math.random() * canvas.height;
        });
    },

    update() {
        this.particles.forEach(p => p.update());
    },

    draw(ctx) {
        // Draw in layers (far to close) for proper depth
        [1, 2, 3].forEach(layer => {
            this.particles
                .filter(p => p.layer === layer)
                .forEach(p => p.draw(ctx));
        });
    }
};

// Snow accumulation on ground
// Snow accumulation on ground
function drawSnowGround(ctx, canvas, ground) {
    const groundY = ground.y;

    // 1. Snowy ground gradient (Depth)
    const gradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    gradient.addColorStop(0, '#FFFFFF');    // Top (Brightest)
    gradient.addColorStop(1, '#D4E6F1');    // Bottom (Shadowy Blue)
    ctx.fillStyle = gradient;
    ctx.fillRect(0, groundY, canvas.width, 100);

    // 2. Snow drifts (wavy top edge)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, groundY);

    for (let x = 0; x < canvas.width; x += 10) {
        // Drift movement animation
        const time = Date.now() / 2000;
        const driftHeight = Math.sin(x / 30 + time) * 5;
        ctx.lineTo(x, groundY + driftHeight);
    }

    ctx.lineTo(canvas.width, groundY);
    ctx.closePath();
    ctx.fill();

    // 3. Shadow border under drifts
    ctx.fillStyle = '#A9CCE3'; // Darker blue shadow
    for (let x = 0; x < canvas.width; x += 10) {
        const time = Date.now() / 2000;
        const driftHeight = Math.sin(x / 30 + time) * 5;
        ctx.fillRect(x, groundY + driftHeight, 10, 3);
    }

    // 4. Buried Candy Canes (Decorations)
    for (let i = 0; i < 5; i++) {
        // Static positions relative to canvas width
        const cx = (canvas.width / 5) * i + 40;
        // Simple pixel candy cane
        drawBuriedCandyCane(ctx, cx, groundY + 10);
    }

    // 5. Sparkles on snow (Texture)
    if (Math.random() < 0.2) {
        const sparkleX = Math.random() * canvas.width;
        const sparkleY = groundY + Math.random() * 30;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(sparkleX, sparkleY, 2, 2);
        ctx.globalAlpha = 1;
    }
}

function drawBuriedCandyCane(ctx, x, y) {
    ctx.fillStyle = '#E31C23'; // Red
    ctx.fillRect(x, y, 4, 12);
    ctx.fillRect(x + 2, y - 2, 4, 2);
    ctx.fillRect(x + 4, y, 2, 4); // Hook

    // Stripes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y + 2, 4, 2);
    ctx.fillRect(x, y + 6, 4, 2);
    ctx.fillRect(x, y + 10, 4, 2);
}

// Initialize snow when Christmas mode is active
if (window.CHRISTMAS_MODE && typeof canvas !== 'undefined') {
    snowSystem.init(canvas);
}
