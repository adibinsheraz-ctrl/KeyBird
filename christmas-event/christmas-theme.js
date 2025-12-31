/* ===================================
   CHRISTMAS THEME MODIFICATIONS
   Santa bird, candy cane pipes, and festive rendering
   =================================== */

// Christmas configuration (embedded to avoid CORS issues)
const christmasConfig = {
    eventName: "Christmas Edition 2025",
    startDate: "2025-12-01T00:00:00Z",
    endDate: "2026-01-06T23:59:59Z",
    version: "1.0.0",
    features: {
        snowfall: true,
        christmasLights: true,
        presents: true,
        powerUps: true,
        comboSystem: true,
        customSounds: true,
        santaBird: true,
        candyCanePipes: true
    },
    difficulty: {
        presentSpawnRate: 180,
        powerUpSpawnChance: 0.01,
        comboDecayTime: 120,
        baseGameSpeed: 1.0
    },
    visuals: {
        snowParticleCount: 150,
        maxSparkles: 50,
        starCount: 100,
        christmasLightsCount: 15
    },
    audio: {
        backgroundMusicVolume: 0.3,
        sfxVolume: 0.5,
        enableJingleBells: true,
        enableHoHoHo: true
    },
    scoring: {
        redPresentPoints: 1,
        greenPresentPoints: 3,
        bluePresentPoints: 5,
        comboMultiplierStep: 0.5,
        comboThreshold: 5
    }
};

// Make config globally available
window.christmasConfig = christmasConfig;

// ============ SANTA BIRD RENDERING ============

function drawSantaBird(ctx, bird) {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation * Math.PI / 180);

    // Dynamic Holiday Glow (RED for user request)
    const glowIntensity = 15 + Math.sin(Date.now() / 150) * 8;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = 'rgba(227, 28, 35, 0.8)'; // Santa Red Glow

    // Squash and stretch based on velocity
    const stretch = Math.min(1.2, Math.max(0.8, 1 + bird.velocity * 0.02));
    const squash = Math.min(1.2, Math.max(0.8, 1 - bird.velocity * 0.02));
    ctx.scale(squash, stretch);

    const pixelSize = 2;

    // Santa Bird Sprite (16x16)
    // R=red coat, W=white, B=black, G=gold, P=pink skin, E=eye
    const santaSprite = [
        [0, 0, 0, 0, 0, 'W', 'W', 'W', 'W', 'W', 'W', 0, 0, 0, 0, 0],      // Hat pom-pom
        [0, 0, 0, 0, 'W', 'R', 'R', 'R', 'R', 'R', 'R', 'W', 0, 0, 0, 0],  // Santa hat
        [0, 0, 0, 'W', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'W', 0, 0, 0],
        [0, 0, 'W', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'W', 0, 0], // Red body
        [0, 'W', 'R', 'R', 'R', 'R', 'R', 'R', 'E', 'E', 'E', 'R', 'R', 'W', 0, 0], // Eye
        [0, 'W', 'R', 'R', 'R', 'R', 'R', 'R', 'E', 'B', 'E', 'R', 'R', 'W', 0, 0],
        ['W', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'E', 'E', 'E', 'R', 'R', 'W', 0, 0],
        ['W', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'W', 'W', 'W'], // Beard area
        ['W', 'R', 'B', 'B', 'B', 'B', 'B', 'R', 'R', 'R', 'R', 'R', 'W', 'W', 'W', 0], // Black belt
        ['W', 'R', 'R', 'G', 'G', 'G', 'R', 'R', 'R', 'R', 'W', 'W', 'W', 0, 0, 0], // Gold buckle
        [0, 'W', 'R', 'R', 'R', 'R', 'R', 'R', 'W', 'W', 'W', 0, 0, 0, 0, 0], // White beard
        [0, 0, 'W', 'W', 'R', 'R', 'W', 'W', 'W', 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 'W', 'W', 'W', 'W', 0, 0, 0, 0, 0, 0, 0, 0, 0], // Beard bottom
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const santaColors = {
        0: 'transparent',
        'R': '#E31C23',  // Santa red
        'W': '#FFFFFF',  // White
        'B': '#000000',  // Black
        'G': '#FFD700',  // Gold
        'P': '#FFB6C1',  // Pink
        'E': '#8B4513'   // Brown eye
    };

    // Draw Santa sprite
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const colorKey = santaSprite[y][x];
            if (colorKey !== 0) {
                ctx.fillStyle = santaColors[colorKey];
                ctx.fillRect(
                    (x - 8) * pixelSize,
                    (y - 8) * pixelSize,
                    pixelSize,
                    pixelSize
                );
            }
        }
    }

    // Outline for definition - REMOVED
    // ctx.strokeStyle = '#000000';
    // ctx.lineWidth = 1;
    // ctx.strokeRect(-16, -16, 32, 32);

    ctx.restore();

    // Hat wobble animation - REMOVED (Fixed white dot issue)
    // drawSantaHatWobble(ctx, bird);
}

function drawSantaHatWobble(ctx, bird) {
    const wobble = Math.sin(Date.now() / 100) * 2;

    ctx.save();
    ctx.translate(bird.x, bird.y - 18 + wobble);

    // Pom-pom bounce
    const bounce = Math.abs(Math.sin(Date.now() / 150)) * 3;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -bounce, 4, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

// ============ CANDY CANE PIPES ============

function drawCandyCanePipe(ctx, pipe) {
    const stripeWidth = 8;

    // Top pipe with candy cane stripes
    drawCandyCanePattern(ctx, pipe.x, 0, pipe.width, pipe.topHeight, stripeWidth);
    drawHollyCap(ctx, pipe.x, pipe.topHeight, pipe.width, true);

    // Draw icicles on top pipe
    drawIcicles(ctx, pipe.x, pipe.topHeight, pipe.width);

    // Bottom pipe with candy cane stripes
    drawCandyCanePattern(ctx, pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY, stripeWidth);
    drawHollyCap(ctx, pipe.x, pipe.bottomY, pipe.width, false);

    // Draw snow cap on bottom pipe
    drawSnowCap(ctx, pipe.x, pipe.bottomY, pipe.width);

    // Sparkles on pipes (animated)
    if (Math.random() < 0.05) {
        createPipeSparkle(pipe);
    }
}

function drawCandyCanePattern(ctx, x, y, width, height, stripeWidth) {
    // Animated scroll offset (Barber Pole effect)
    const animationSpeed = 0.05; // Pixels per ms
    const offset = (Date.now() * animationSpeed) % (stripeWidth * 2);

    // Optimized drawing: Draw base white, then red stripes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = '#E31C23';
    ctx.beginPath();

    // Draw alternating red diagonal stripes
    // Use canvas clipping for clean edges
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    ctx.fillStyle = '#E31C23';

    // Calculate total diagonal length needed
    const diag = Math.sqrt(width * width + height * height);

    for (let i = -height; i < width + height; i += stripeWidth * 2) {
        // Draw diagonal strip
        // y = x + c line equation style
        const startX = x + i - offset;

        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + stripeWidth, y);
        ctx.lineTo(startX + stripeWidth - height, y + height);
        ctx.lineTo(startX - height, y + height);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    // Thick black outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
}

function drawIcicles(ctx, x, y, width) {
    ctx.fillStyle = 'rgba(200, 240, 255, 0.8)';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;

    const seed = Math.floor(x); // Consistent randomness based on position

    for (let i = 4; i < width - 4; i += 6) {
        // Pseudo-random length based on position
        const len = 10 + Math.abs(Math.sin(seed + i * 0.5)) * 20;

        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + 3, y + len);
        ctx.lineTo(x + i + 6, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function drawSnowCap(ctx, x, y, width) {
    // Fluffy snow on top of the bottom pipe cap
    ctx.fillStyle = '#FFFFFF';
    const snowHeight = 10;

    ctx.beginPath();
    ctx.moveTo(x - 6, y);

    // Draw bumps
    for (let i = 0; i <= width + 8; i += 8) {
        const bumpHeight = 8 + Math.sin(i * 0.3) * 5;
        ctx.quadraticCurveTo(x - 4 + i + 4, y - bumpHeight, x - 4 + i + 8, y);
    }

    ctx.lineTo(x + width + 4, y);
    ctx.closePath();
    ctx.fill();
}

function drawHollyCap(ctx, x, y, width, isTop) {
    const capHeight = 24;
    const capY = isTop ? y - capHeight : y;

    // Green cap background
    ctx.fillStyle = '#0F7D3A';
    ctx.fillRect(x - 4, capY, width + 8, capHeight);

    // Gold ribbon
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 4, capY + 8, width + 8, 4);

    // Cap outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 4, capY, width + 8, capHeight);

    // Holly leaves (simple circles)
    ctx.fillStyle = '#2ECC71';
    ctx.beginPath();
    ctx.arc(x + 10, capY + 12, 5, 0, Math.PI * 2);
    ctx.arc(x + width - 20, capY + 12, 5, 0, Math.PI * 2);
    ctx.fill();

    // Red berries
    ctx.fillStyle = '#E31C23';
    ctx.beginPath();
    ctx.arc(x + 15, capY + 10, 3, 0, Math.PI * 2);
    ctx.arc(x + 20, capY + 8, 3, 0, Math.PI * 2);
    ctx.arc(x + 18, capY + 14, 3, 0, Math.PI * 2);
    ctx.fill();
}

// Pipe sparkles
let pipeSparkles = [];

function createPipeSparkle(pipe) {
    pipeSparkles.push({
        x: pipe.x + Math.random() * pipe.width,
        y: Math.random() * pipe.topHeight,
        life: 30,
        size: 4 + Math.random() * 4,
        color: ['#FFD700', '#FFFFFF', '#FFED4E'][Math.floor(Math.random() * 3)]
    });
}

function updatePipeSparkles() {
    pipeSparkles = pipeSparkles.filter(sparkle => {
        sparkle.life--;
        return sparkle.life > 0;
    });
}

function drawPipeSparkles(ctx) {
    pipeSparkles.forEach(sparkle => {
        const alpha = sparkle.life / 30;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = sparkle.color;

        // 4-pointed star shape
        ctx.translate(sparkle.x, sparkle.y);
        ctx.rotate(Date.now() / 200);

        ctx.beginPath();
        ctx.moveTo(0, -sparkle.size);
        ctx.lineTo(sparkle.size / 3, 0);
        ctx.lineTo(sparkle.size, 0);
        ctx.lineTo(sparkle.size / 3, 0);
        ctx.lineTo(0, sparkle.size);
        ctx.lineTo(-sparkle.size / 3, 0);
        ctx.lineTo(-sparkle.size, 0);
        ctx.lineTo(-sparkle.size / 3, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

// ============ CHRISTMAS BACKGROUND ============

function drawChristmasBackground(ctx, canvas, score) {
    // Night sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0A1828');    // Dark at top
    gradient.addColorStop(0.3, '#1C3557');  // Mid blue
    gradient.addColorStop(0.7, '#2E5077');  // Lighter blue
    gradient.addColorStop(1, '#4A7BA7');    // Horizon

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Advanced Northern Lights
    if (typeof northernLights !== 'undefined' && northernLights) {
        northernLights.draw(ctx);
    }

    // Advanced Star Field
    if (typeof starField !== 'undefined' && starField) {
        starField.draw(ctx);
    } else {
        // Fallback to simple stars
        drawTwinklingStars(ctx, canvas);
    }

    // Christmas moon
    drawChristmasMoon(ctx, canvas);

    // Distant snowy trees
    drawDistantTrees(ctx, canvas);
}

// Twinkling stars
let stars = [];

function initStars(canvas) {
    stars = [];
    const config = window.christmasConfig?.visuals || { starCount: 100 };

    for (let i = 0; i < config.starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.6),
            size: 1 + Math.floor(Math.random() * 3),
            brightness: Math.random(),
            twinkleSpeed: 0.01 + Math.random() * 0.02,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function drawTwinklingStars(ctx, canvas) {
    if (stars.length === 0) initStars(canvas);

    stars.forEach(star => {
        star.phase += star.twinkleSpeed;
        const brightness = 0.3 + Math.sin(star.phase) * 0.7;

        ctx.save();
        ctx.globalAlpha = brightness;
        ctx.fillStyle = '#FFFFFF';

        if (star.size === 1) {
            ctx.fillRect(star.x, star.y, 2, 2);
        } else {
            // 4-point star
            ctx.fillRect(star.x - 1, star.y - star.size, 2, star.size * 2);
            ctx.fillRect(star.x - star.size, star.y - 1, star.size * 2, 2);
        }

        ctx.restore();
    });
}

function drawChristmasMoon(ctx, canvas) {
    const moonX = canvas.width - 80;
    const moonY = 80;
    const moonRadius = 35;

    // Moon glow
    const glow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius + 20);
    glow.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
    glow.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius + 20, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // Moon craters
    ctx.fillStyle = '#F0E68C';
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY - 5, 8, 0, Math.PI * 2);
    ctx.arc(moonX + 8, moonY + 10, 5, 0, Math.PI * 2);
    ctx.arc(moonX + 5, moonY - 15, 6, 0, Math.PI * 2);
    ctx.fill();
}

function drawDistantTrees(ctx, canvas) {
    // Generate a dense forest based on canvas width (seeded-like relative to width)
    const treeCount = 15;
    const spacing = canvas.width / treeCount;

    const groundY = canvas.height - 50;
    const time = Date.now();

    for (let i = 0; i < treeCount; i++) {
        // Pseudo-random properties based on index
        const x = i * spacing + (i * 1234 % 20);
        const height = 60 + (i * 987 % 60);
        const width = height * 0.4;

        // Sway animation
        const sway = Math.sin(time / 1000 + i) * 2;

        drawDetailedPineTree(ctx, x, groundY, width, height, sway, i);
    }
}

function drawDetailedPineTree(ctx, x, groundY, width, height, sway, seed) {
    // Three tiers of leaves
    const tiers = 3;
    const tierHeight = height / tiers;

    // Gradient for tree
    const gradient = ctx.createLinearGradient(x, groundY - height, x, groundY);
    gradient.addColorStop(0, '#1E5631'); // Lighter top
    gradient.addColorStop(1, '#0D2818'); // Darker bottom
    ctx.fillStyle = gradient;

    for (let t = 0; t < tiers; t++) {
        const tWidth = width * (1 - t * 0.2); // Smaller at top
        const tBaseY = groundY - t * (tierHeight * 0.8);
        const tTopY = groundY - (t + 1) * tierHeight - (t === tiers - 1 ? 0 : 10);

        const currentSway = sway * ((t + 1) / tiers); // More sway at top

        ctx.beginPath();
        ctx.moveTo(x - tWidth / 2 + currentSway, tBaseY);
        ctx.lineTo(x + tWidth / 2 + currentSway, tBaseY);
        ctx.lineTo(x + currentSway, tTopY);
        ctx.closePath();
        ctx.fill();

        // Snow on tier branches
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        // Left branch snow
        ctx.moveTo(x - tWidth / 2 + currentSway, tBaseY);
        ctx.lineTo(x - tWidth / 2 + 10 + currentSway, tBaseY - 5);
        ctx.lineTo(x - tWidth / 4 + currentSway, tBaseY);
        // Right branch snow
        ctx.moveTo(x + tWidth / 2 + currentSway, tBaseY);
        ctx.lineTo(x + tWidth / 2 - 10 + currentSway, tBaseY - 5);
        ctx.lineTo(x + tWidth / 4 + currentSway, tBaseY);
        ctx.fill();
        ctx.fillStyle = gradient; // Restore green
    }

    // Ornaments (Blinking lights)
    if (seed % 2 === 0) { // On every other tree
        const ornamentCount = 5;
        for (let j = 0; j < ornamentCount; j++) {
            const oy = groundY - height * 0.2 - (j * height * 0.15);
            const ox = x + Math.sin(j * 5 + seed) * (width * 0.3) + sway; // Scatter

            // Blink logic
            const blink = Math.sin(Date.now() / 200 + seed + j) > 0;
            if (blink) {
                ctx.fillStyle = ['#E31C23', '#FFD700', '#3498DB'][j % 3];
                ctx.beginPath();
                ctx.arc(ox, oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        drawSantaBird,
        drawCandyCanePipe,
        drawChristmasBackground,
        updatePipeSparkles,
        drawPipeSparkles
    };
}
