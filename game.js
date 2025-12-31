/* ===================================
   KEYBIRD - CARTOONISH PIXEL GAME
   Main Game Logic with Professional UI
   =================================== */

// ============ CANVAS SETUP ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Disable image smoothing for pixel-perfect rendering
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

// ============ GAME CONSTANTS ============
const GRAVITY = 0.45; // Bit heavier for snappier feel
const JUMP_STRENGTH = -7.5; // Stronger jump to match
const TERMINAL_VELOCITY = 10;
const INITIAL_SPEED = 2;
const PIPE_GAP = 150;
const PIPE_SPACING = 200;
const BIRD_RADIUS = 10; // Slightly smaller hitbox for fairer play
const GROUND_HEIGHT = 50;

// ============ GAME STATE ============
let gameState = 'READY'; // READY, PLAYING, GAME_OVER
let gameSpeed = INITIAL_SPEED;
let score = 0;
let highScore = 0;
let frameCount = 0;
let pipes = [];
let muted = false;
let particles = [];

// ============ ANIMATION STATE ============
let scoreJustIncreased = false;
let scoreAnimProgress = 0;
let overlayAlpha = 0;
let panelY = -300;
let panelSlideSpeed = 20;
let panelBounce = 0;
let displayScore = 0;
let medalScale = 0;
let medalRotation = 0;
let screenShakeX = 0;
let screenShakeY = 0;
let shakeIntensity = 0;
let newRecordBadgeScale = 0;
let isNewRecord = false;
let medalSoundPlayed = false;
let panelSoundPlayed = false;

// ============ 10x UPDATE STATE ============
let timeOfDay = 0; // 0=Day, 1=Night
let bgGradient = { top: '#4EC0CA', bottom: '#87CEEB' }; // Initial sky
let clouds = [];
let cityX = 0;
let floatingTexts = [];
let birdTrail = [];
let combo = 0; // For "Perfect" streaks

// ============ BIRD OBJECT ============
const bird = {
    x: 80,
    y: 250,
    width: 28,
    height: 28,
    velocity: 0,
    rotation: 0,
    frame: 0,
    frameTimer: 0,
    flapTimer: 0,
    isFlapping: false,
    type: localStorage.getItem('selectedBirdType') || 'classic' // classic, realistic, advanced
};

window.setSelectedBird = function (type) {
    bird.type = type;
    localStorage.setItem('selectedBirdType', type);

    // Track bird selection
    if (window.trackActivity) {
        window.trackActivity('bird_select', { bird_type: type });
    }
};

// ============ GROUND OBJECT ============
const ground = {
    x: 0,
    y: canvas.height - GROUND_HEIGHT,
    width: canvas.width,
    height: GROUND_HEIGHT,
    speed: INITIAL_SPEED
};

// ============ PARTICLE CLASS ============
class Particle {
    constructor(x, y, color, size) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6 - 2;
        this.life = 30;
        this.maxLife = 30;
        this.color = color;
        this.size = size;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 20;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3; // Gravity
        this.rotation += this.rotationSpeed;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = alpha;

        // Draw particle square
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.restore();
    }
}

// ============ WEB AUDIO API SETUP ============
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function play8BitSound(type) {
    if (muted) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    const now = audioContext.currentTime;

    switch (type) {
        case 'flap':
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;

        case 'score':
            playNote(523, 0, 0.05);
            playNote(659, 0.05, 0.05);
            playNote(784, 0.1, 0.1);
            return;

        case 'hit':
            const bufferSize = audioContext.sampleRate * 0.15;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = audioContext.createBufferSource();
            noise.buffer = buffer;
            noise.connect(gainNode);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            noise.start(now);
            return;

        case 'die':
            oscillator.frequency.setValueAtTime(880, now);
            oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.2);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;

        case 'button':
            oscillator.frequency.setValueAtTime(600, now);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            oscillator.start(now);
            oscillator.stop(now + 0.08);
            break;

        case 'whoosh':
            // Panel whoosh sound - white noise sweep
            const whooshSize = audioContext.sampleRate * 0.3;
            const whooshBuffer = audioContext.createBuffer(1, whooshSize, audioContext.sampleRate);
            const whooshData = whooshBuffer.getChannelData(0);
            for (let i = 0; i < whooshSize; i++) {
                whooshData[i] = (Math.random() * 2 - 1) * (1 - i / whooshSize);
            }
            const whooshNoise = audioContext.createBufferSource();
            const whooshFilter = audioContext.createBiquadFilter();
            whooshNoise.buffer = whooshBuffer;
            whooshFilter.type = 'lowpass';
            whooshFilter.frequency.value = 2000;
            whooshNoise.connect(whooshFilter);
            whooshFilter.connect(gainNode);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            whooshNoise.start(now);
            return;

        case 'medal':
            // Medal award sound - ascending chime
            playNote(659, 0, 0.08);    // E5
            playNote(784, 0.08, 0.08); // G5
            playNote(988, 0.16, 0.15); // B5
            return;
    }
}

function playNote(frequency, startTime, duration) {
    if (muted) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'square';
    osc.frequency.value = frequency;

    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0.2, now + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, now + startTime + duration);

    osc.start(now + startTime);
    osc.stop(now + startTime + duration);
}

// ============ TEXT RENDERING WITH CARTOON OUTLINE ============
function drawCartoonText(text, x, y, size, color) {
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Black outline (thick for cartoon effect)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(4, size / 10);
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);

    // White inner glow
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(2, size / 20);
    ctx.strokeText(text, x, y);

    // Main color fill
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

// ============ PIXEL ART RENDERING ============
function drawPixelBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation * Math.PI / 180);

    const isChristmas = window.CHRISTMAS_MODE;

    if (bird.type === 'realistic') {
        drawRealisticBird(ctx, isChristmas);
    } else if (bird.type === 'advanced') {
        drawAdvancedPixelBird(ctx, isChristmas);
    } else {
        drawClassicBird(ctx, isChristmas);
    }

    ctx.restore();
}

function drawClassicBird(ctx, isChristmas) {
    const stretch = 1 + Math.min(0.15, Math.abs(bird.velocity * 0.02));
    const squash = 1 / stretch;
    ctx.scale(squash, stretch);

    const bodyColor = isChristmas ? '#D32F2F' : '#FFD700';
    const outline = '#000000';

    // Simple Round Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(5, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(18, 2);
    ctx.lineTo(10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing
    ctx.fillStyle = bodyColor;
    let wingY = 0;
    if (bird.isFlapping) wingY = bird.flapTimer < 5 ? -bird.flapTimer : -(10 - bird.flapTimer);
    ctx.translate(-2, 2 + wingY);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tiny Hat if Christmas
    if (isChristmas) drawTinySantaHat(ctx, 13);
}

function drawRealisticBird(ctx, isChristmas) {
    const stretch = 1 + Math.min(0.2, Math.abs(bird.velocity * 0.025));
    const squash = 1 / stretch;
    ctx.scale(squash, stretch);

    const colors = isChristmas ? {
        base: '#D32F2F', shadow: '#7B1B1B', highlight: '#FF8A80',
        beak: '#FF9800', eye: '#000000', belly: '#FFFFFF'
    } : {
        base: '#FBC02D', shadow: '#F57F17', highlight: '#FFF9C4',
        beak: '#E65100', eye: '#000000', belly: '#FFFDE7'
    };

    // Organic Tail
    ctx.fillStyle = colors.base;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-20, -6); ctx.lineTo(-18, -2); ctx.lineTo(-22, 2); ctx.lineTo(-18, 6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Body & Shading
    ctx.fillStyle = colors.base;
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();

    // Feather Texture
    ctx.strokeStyle = colors.shadow; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-4 + i * 4, -2 + i * 2, 6, 0.5, 2.5); ctx.stroke(); }

    // Belly
    ctx.fillStyle = colors.belly;
    ctx.beginPath(); ctx.ellipse(5, 5, 9, 7, 0.3, 0, Math.PI * 2); ctx.fill();

    // Eye
    ctx.fillStyle = colors.eye;
    ctx.beginPath(); ctx.arc(7, -5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(8.5, -6.5, 1.5, 0, Math.PI * 2); ctx.fill();

    // Beak
    ctx.fillStyle = colors.beak;
    ctx.beginPath(); ctx.moveTo(12, -2); ctx.quadraticCurveTo(24, -3, 26, 4); ctx.lineTo(13, 6); ctx.closePath(); ctx.fill(); ctx.stroke();

    // Wing
    ctx.save();
    let wingRot = bird.isFlapping ? -(bird.flapTimer / 5) * Math.PI / 2 : 0;
    ctx.translate(-2, 1); ctx.rotate(wingRot);
    ctx.fillStyle = colors.base;
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.bezierCurveTo(12, -8, 14, 8, 0, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    if (isChristmas) drawTinySantaHat(ctx, 14);
}

function drawAdvancedPixelBird(ctx, isChristmas) {
    const p = 2.5; // Advanced Pixel Size
    const stretch = 1 + Math.sin(bird.velocity * 0.1) * 0.15;
    const squash = 1 / stretch;
    ctx.scale(squash, stretch);

    const colors = isChristmas ? {
        base: '#E31C23', dark: '#910A0E', light: '#FF5252', outline: '#000000', glow: 'rgba(255, 255, 255, 0.4)'
    } : {
        base: '#FFD700', dark: '#B8860B', light: '#FFFACD', outline: '#000000', glow: 'rgba(255, 215, 0, 0.3)'
    };

    // Pulsing Glow
    const pulse = Math.sin(Date.now() / 200) * 5;
    ctx.shadowBlur = 10 + pulse;
    ctx.shadowColor = colors.glow;

    // Drawing blocks to form a 3D pixel sphere
    const fillP = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * p, y * p, w * p, h * p); };

    // 1. Outline Layer
    ctx.fillStyle = colors.outline;
    fillP(-5, -6, 10, 12); // vertical core
    fillP(-6, -5, 12, 10); // horizontal core

    // 2. Base Color
    fillP(-4, -5, 8, 10, colors.base);
    fillP(-5, -4, 10, 8, colors.base);

    // 3. 3D Shading (Pixel blocks)
    fillP(-4, 3, 8, 2, colors.dark); // Bottom shadow
    fillP(3, -4, 1, 8, colors.dark);  // Front shadow
    fillP(-3, -5, 4, 2, colors.light); // Top highlight
    fillP(-5, -3, 2, 4, colors.light); // Left highlight

    // 4. Eye (Glossy Pixel)
    fillP(2, -3, 2.5, 2.5, '#000');
    fillP(3.5, -3.5, 1, 1, '#FFF');

    // 5. Beak (Sharp Pixel)
    fillP(5, 0.5, 3, 2, '#FF8C00');
    fillP(8, 1, 2, 1, '#FF4500');

    // 6. Mechanical Wing
    ctx.save();
    let wingY = bird.isFlapping ? (bird.flapTimer < 5 ? -bird.flapTimer : -(10 - bird.flapTimer)) : 0;
    ctx.translate(-4 * p, wingY * p);
    fillP(-1, -1, 5, 3, colors.base);
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 1;
    ctx.strokeRect(-1 * p, -1 * p, 5 * p, 3 * p);
    // Wing highlight
    fillP(0, -1, 3, 1, colors.light);
    ctx.restore();

    ctx.shadowBlur = 0; // Reset glow for other elements

    if (isChristmas) drawTinySantaHat(ctx, 6 * p / 2);
}

function drawTinySantaHat(ctx, radius) {
    ctx.save();
    ctx.translate(0, -radius + 2);
    // Fluffy White Trim
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.arc(-radius + 8 + i * 3, 0, 2, 0, Math.PI * 2); ctx.fill();
    }
    // Hat Cone
    ctx.fillStyle = window.CHRISTMAS_MODE ? '#D32F2F' : '#FF0000';
    ctx.beginPath(); ctx.moveTo(-radius + 8, 0); ctx.quadraticCurveTo(0, -12, radius + 2, -1); ctx.lineTo(radius - 6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Pompom
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(radius + 2, -1, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
}

function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    x = Math.floor(x / 4) * 4;
    y = Math.floor(y / 4) * 4;
    w = Math.floor(w / 4) * 4;
    h = Math.floor(h / 4) * 4;
    ctx.fillRect(x, y, w, h);
}

function drawGradientPipe(x, y, width, height, isTop) {
    // Cylinder Gradient
    const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, '#558C22'); // Dark edge
    gradient.addColorStop(0.1, '#73BF2E'); // Main color
    gradient.addColorStop(0.4, '#9CE659'); // Highlight
    gradient.addColorStop(0.8, '#73BF2E'); // Main color
    gradient.addColorStop(1, '#558C22'); // Dark edge

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Outline
    ctx.strokeStyle = '#2F4F4F';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Cap details
    const capHeight = 24;
    const capY = isTop ? y + height - capHeight : y;

    // Cap Gradient
    const capGradient = ctx.createLinearGradient(x - 4, 0, x + width + 4, 0);
    capGradient.addColorStop(0, '#558C22');
    capGradient.addColorStop(0.1, '#73BF2E');
    capGradient.addColorStop(0.4, '#9CE659');
    capGradient.addColorStop(0.8, '#73BF2E');
    capGradient.addColorStop(1, '#558C22');

    ctx.fillStyle = capGradient;
    ctx.fillRect(x - 4, capY, width + 8, capHeight);

    // Cap Outline
    ctx.strokeRect(x - 4, capY, width + 8, capHeight);

    // Highlight line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 10, y, 6, height);
    ctx.fillRect(x + 6, capY, 6, capHeight);
}

function drawPixelPipe(pipe) {
    // Top Pipe
    drawGradientPipe(pipe.x, 0, pipe.width, pipe.topHeight, true);

    // Bottom Pipe
    drawGradientPipe(pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY, false);
}

function drawPixelGround() {
    // Dirt Gradient
    const gradient = ctx.createLinearGradient(0, ground.y, 0, canvas.height);
    gradient.addColorStop(0, '#D2B48C'); // Tan
    gradient.addColorStop(1, '#8B4513'); // SaddleBrown
    ctx.fillStyle = gradient;
    ctx.fillRect(0, ground.y, canvas.width, ground.height);

    // Dirt Noise (Specks)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 50; i++) {
        const speckX = (Math.abs(Math.sin(i * 123.45)) * 1000 + ground.x * 0.5) % canvas.width;
        const speckY = ground.y + (Math.abs(Math.cos(i * 678.9)) * ground.height);
        ctx.fillRect(speckX, speckY, 2, 2);
    }

    // Layered Grass (Back Layer - Darker)
    ctx.fillStyle = '#228B22'; // ForestGreen
    const backPatternSize = 30;
    const backOffset = (ground.x * 0.8) % backPatternSize;
    for (let x = backOffset - backPatternSize; x < canvas.width + backPatternSize; x += backPatternSize) {
        ctx.beginPath();
        ctx.moveTo(x, ground.y + 12);
        ctx.lineTo(x + 15, ground.y + 6);
        ctx.lineTo(x + 30, ground.y + 12);
        ctx.fill();
    }

    // Grass Top (Main Layer)
    ctx.fillStyle = '#7CFC00'; // LawnGreen
    ctx.fillRect(0, ground.y, canvas.width, 12);

    // Grass Details (moving)
    ctx.fillStyle = '#32CD32'; // LimeGreen
    const patternSize = 20;
    const offset = ground.x % patternSize;
    for (let x = offset - patternSize; x < canvas.width + patternSize; x += patternSize) {
        // Zigzag grass pattern
        ctx.beginPath();
        ctx.moveTo(x, ground.y + 12);
        ctx.lineTo(x + 10, ground.y + 4);
        ctx.lineTo(x + 20, ground.y + 12);
        ctx.fill();
    }

    // Flowers
    const flowerColors = ['#FF4500', '#1E90FF', '#FFFFFF', '#FFD700'];
    for (let i = 0; i < 8; i++) {
        const flowerX = (ground.x + i * 180) % (canvas.width + 180) - 90;
        if (flowerX > -20 && flowerX < canvas.width + 20) {
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.fillRect(flowerX, ground.y + 8, 4, 4); // Flower head
            ctx.fillStyle = '#228B22';
            ctx.fillRect(flowerX + 1, ground.y + 12, 2, 4); // Stem
        }
    }

    // Dirt Details (stones)
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let x = 0; x < canvas.width; x += 60) {
        const stoneX = (x + ground.x) % canvas.width;
        // Wrap fix
        const drawX = stoneX < 0 ? stoneX + canvas.width : stoneX;
        ctx.fillRect(drawX, ground.y + 25, 8, 6);
        ctx.fillRect(drawX + 30, ground.y + 35, 5, 4);
    }

    // Top Border
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(0, ground.y, canvas.width, 2);
}

class FloatingText {
    constructor(text, x, y) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.life = 60;
        this.vy = -2;
    }
    update() {
        this.y += this.vy;
        this.vy *= 0.9;
        this.life--;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.life / 20);
        drawCartoonText(this.text, this.x, this.y, 20, '#FFF');
        ctx.restore();
    }
}

class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * 100;
        this.y = Math.random() * (canvas.height / 2);
        this.speed = 0.5 + Math.random() * 0.5;
        this.width = 60 + Math.random() * 40;
    }
    update() {
        if (gameState === 'PLAYING') {
            this.x -= this.speed;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Cloud Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(5, 5, 20, 0, Math.PI * 2);
        ctx.arc(30, -5, 25, 0, Math.PI * 2);
        ctx.arc(55, 5, 20, 0, Math.PI * 2);
        ctx.fill();

        // Cloud Body (Gradient)
        const grad = ctx.createRadialGradient(30, 0, 0, 30, 0, 40);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#E6E6FA'); // Lavender tint

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.arc(25, -10, 25, 0, Math.PI * 2);
        ctx.arc(50, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function drawPixelBackground() {
    // Dynamic background based on score
    const cycle = (score % 50) / 50; // 0 to 1 cycle every 50 points

    let topColor, bottomColor;

    if (cycle < 0.3) {
        // Day
        topColor = '#2A9AA5';
        bottomColor = '#4EC0CA';
    } else if (cycle < 0.6) {
        // Sunset
        topColor = '#FF4500';
        bottomColor = '#FF7F50';
    } else {
        // Night
        topColor = '#000033';
        bottomColor = '#191970';
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars at night
    if (cycle >= 0.6) {
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 20; i++) {
            // Pseudo-random stars based on position (so they don't flicker)
            const sx = (i * 37) % canvas.width;
            const sy = (i * 91) % (canvas.height / 2);
            ctx.fillRect(sx, sy, 2, 2);
        }
    }

    // Draw clouds
    clouds.forEach(cloud => cloud.draw(ctx));

    // Draw city silhouette (parallax)
    const isNight = cycle >= 0.6;
    ctx.fillStyle = isNight ? '#000033' : '#2F4F4F'; // Darker at night

    const cityOffset = cityX % 200; // Slower parallax

    // Procedural buildings
    for (let i = -100; i < canvas.width + 100; i += 50) {
        // Pseudo-random height based on position
        const h = 60 + Math.abs(Math.sin(i * 132)) * 100;
        const x = i - cityOffset;

        // Building
        ctx.fillRect(x, canvas.height - GROUND_HEIGHT - h, 40, h);

        // Windows
        if (isNight) {
            ctx.fillStyle = '#FFFF00'; // Lights on
            for (let wy = canvas.height - GROUND_HEIGHT - h + 10; wy < canvas.height - GROUND_HEIGHT - 10; wy += 15) {
                if (Math.sin(wy * i) > 0) { // Random lights
                    ctx.fillRect(x + 5, wy, 6, 8);
                    ctx.fillRect(x + 25, wy, 6, 8);
                }
            }
            ctx.fillStyle = '#000033'; // Reset for next building
        }
    }
}

// ============ PARTICLE EFFECTS ============
function createScoreParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const particle = new Particle(x, y, '#FFD700', 6);
        particle.vx = Math.cos(angle) * 3;
        particle.vy = Math.sin(angle) * 3;
        particles.push(particle);
    }
}

function createDeathExplosion(x, y) {
    // White burst
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, '#FFFFFF', 8));
    }

    // Colored feathers
    const colors = ['#FFD700', '#FF8C00', '#DC143C'];
    for (let i = 0; i < 15; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, color, 6));
    }
}

function createPipePassSparkles(pipeX, birdY) {
    // Green sparkles when passing pipe
    for (let i = 0; i < 6; i++) {
        const particle = new Particle(
            pipeX + 26,
            birdY + (Math.random() - 0.5) * 40,
            '#7CD67C',
            4
        );
        particle.vx = Math.random() * 2 + 1;
        particle.vy = (Math.random() - 0.5) * 2;
        particles.push(particle);
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(particle => particle.draw(ctx));
}

// ============ GAME LOGIC ============
function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - GROUND_HEIGHT - PIPE_GAP - 50;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    return {
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + PIPE_GAP,
        width: 52,
        scored: false
    };
}

function updateBird() {
    if (gameState === 'PLAYING' || gameState === 'CRASHED') {
        bird.velocity += GRAVITY;
        if (bird.velocity > TERMINAL_VELOCITY) {
            bird.velocity = TERMINAL_VELOCITY;
        }
        bird.y += bird.velocity;

        // Update rotation based on velocity (Smooth Lerp)
        let targetRotation = Math.min(Math.max(bird.velocity * 4, -25), 90);
        bird.rotation += (targetRotation - bird.rotation) * 0.15;
    } else if (gameState === 'READY') {
        // Gentle bob animation
        bird.y = 250 + Math.sin(frameCount * 0.05) * 15;
        bird.rotation = Math.sin(frameCount * 0.05) * 3;
    }

    // Animate wing flap
    if (bird.isFlapping) {
        bird.flapTimer++;
        if (bird.flapTimer > 10) {
            bird.isFlapping = false;
            bird.flapTimer = 0;
        }
    }
}

function updatePipes() {
    if (gameState !== 'PLAYING') return;

    // Move pipes
    pipes.forEach(pipe => {
        pipe.x -= gameSpeed;

        // Check if bird passed pipe
        if (!pipe.scored && bird.x > pipe.x + pipe.width) {
            score++;
            pipe.scored = true;
            play8BitSound('score');
            scoreJustIncreased = true;
            scoreAnimProgress = 1.0;
            shakeIntensity = 3; // Subtle pop on score
            createScoreParticles(canvas.width / 2, 80);
            createPipePassSparkles(pipe.x, bird.y);

            // Christmas Event Features
            if (window.CHRISTMAS_MODE) {
                if (typeof streakSystem !== 'undefined' && streakSystem) {
                    streakSystem.addPipe();
                }
                if (typeof achievementSystem !== 'undefined' && achievementSystem) {
                    achievementSystem.checkAchievements(score);
                }
            }

            // 10x Feature: Floating Text
            floatingTexts.push(new FloatingText("+1", bird.x, bird.y - 20));

            // 10x Feature: Combo check (center pass)
            const pipeCenter = pipe.topHeight + PIPE_GAP / 2;
            if (Math.abs(bird.y - pipeCenter) < 15) {
                combo++;
                if (combo > 1) {
                    floatingTexts.push(new FloatingText("PERFECT!", bird.x, bird.y - 40));
                    play8BitSound('medal'); // Satisfying sound
                }
            } else {
                combo = 0;
            }
        }
    });

    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x > -pipe.width);

    // Spawn new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - PIPE_SPACING) {
        pipes.push(createPipe());
    }
}

function updateGround() {
    ground.x -= gameSpeed;
    if (ground.x <= -12) {
        ground.x = 0;
    }
}

function checkCollisions() {
    if (gameState !== 'PLAYING' && gameState !== 'CRASHED') return;

    // Ground collision
    if (bird.y + BIRD_RADIUS >= ground.y) {
        bird.y = ground.y - BIRD_RADIUS;
        if (gameState !== 'GAME_OVER') {
            gameOver();
        }
        return;
    }

    // If already crashed, only check for ground
    if (gameState === 'CRASHED') return;

    // Ceiling collision
    if (bird.y - BIRD_RADIUS <= 0) {
        gameState = 'CRASHED';
        gameSpeed = 0;
        play8BitSound('hit');
        setTimeout(() => play8BitSound('die'), 100);
        shakeIntensity = 10;
        return;
    }

    // Pipe collision
    pipes.forEach(pipe => {
        if (bird.x + BIRD_RADIUS > pipe.x && bird.x - BIRD_RADIUS < pipe.x + pipe.width) {
            if (bird.y - BIRD_RADIUS < pipe.topHeight || bird.y + BIRD_RADIUS > pipe.bottomY) {
                gameState = 'CRASHED';
                gameSpeed = 0;
                play8BitSound('hit');
                setTimeout(() => play8BitSound('die'), 100);
                shakeIntensity = 10;
            }
        }
    });
}

function birdFlap() {
    if (gameState === 'READY') {
        startGame();
    } else if (gameState === 'PLAYING') {
        bird.velocity = JUMP_STRENGTH;
        bird.isFlapping = true;
        bird.flapTimer = 0;

        // Use Christmas sound if active
        if (window.CHRISTMAS_MODE && typeof christmasSounds !== 'undefined') {
            christmasSounds.playJingleFlap();

            // Magical Snow Trail
            for (let i = 0; i < 8; i++) {
                // Create sparkle particles
                particles.push({
                    x: bird.x - 10,
                    y: bird.y + (Math.random() - 0.5) * 10,
                    vx: -2 - Math.random() * 2,
                    vy: (Math.random() - 0.5) * 4,
                    life: 40,
                    maxLife: 40,
                    color: Math.random() > 0.5 ? '#E31C23' : '#FFFFFF', // Red and White
                    size: Math.random() * 3 + 1,
                    update: function () {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.life--;
                        this.size *= 0.95;
                    },
                    draw: function (ctx) {
                        ctx.fillStyle = this.color;
                        ctx.globalAlpha = this.life / this.maxLife;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                });
            }
        } else {
            play8BitSound('flap');
        }

        // Tiny shake on flap for "feel"
        if (gameState === 'PLAYING') {
            shakeIntensity = Math.max(shakeIntensity, 1.5);
        }

        // Spawn dust if near ground
        if (bird.y > ground.y - 120) {
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(bird.x, ground.y, '#D2B48C', 4 + Math.random() * 4));
            }
        }
    } else if (gameState === 'GAME_OVER') {
        resetGame();
    }
}

function startGame() {
    gameState = 'PLAYING';
    bird.velocity = JUMP_STRENGTH;
    bird.isFlapping = true;
    bird.flapTimer = 0;
    play8BitSound('flap');

    // Track game start
    if (window.trackActivity) {
        window.trackActivity('game_start', {
            mode: window.CHRISTMAS_MODE ? 'christmas' : 'classic',
            bird_type: bird.type
        });
    }

    // Spawn dust if near ground
    if (bird.y > ground.y - 120) {
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(bird.x, ground.y, '#D2B48C', 4 + Math.random() * 4));
        }
    }

    // Hide UI during gameplay
    const controls = document.querySelector('.mode-controls');
    if (controls) controls.style.display = 'none';
    const birdSelection = document.getElementById('birdSelection');
    if (birdSelection) birdSelection.style.display = 'none';
}

function gameOver() {
    if (gameState === 'GAME_OVER') return;
    gameState = 'GAME_OVER';
    gameSpeed = 0; // Stop background movement

    // Track game over
    if (window.trackActivity) {
        window.trackActivity('game_over', {
            score: score,
            high_score: highScore,
            mode: window.CHRISTMAS_MODE ? 'christmas' : 'classic',
            bird_type: bird.type
        });
    }

    // Create death explosion
    createDeathExplosion(bird.x, bird.y);

    // Check for new record
    const scoreKey = window.CHRISTMAS_MODE ? 'keyBirdChristmasHighScore' : 'keyBirdHighScore';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(scoreKey, highScore);
        isNewRecord = true;
        newRecordBadgeScale = 0;
    } else {
        isNewRecord = false;
    }

    // Reset game over animations
    overlayAlpha = 0;
    panelY = -300;
    panelSlideSpeed = 5;
    displayScore = 0;
    medalScale = 0;
    medalSoundPlayed = false;
    panelSoundPlayed = false;

    // Reset stamping animation variables
    stampProgress = 0;
    stampSquash = 1;
    stampImpact = 0;
    stampParticles = [];
    // Stop Christmas music on game over
    if (window.CHRISTMAS_MODE && typeof christmasSounds !== 'undefined') {
        christmasSounds.stopAllSounds();
    }

    // Show UI on game over
    const controls = document.querySelector('.mode-controls');
    if (controls) controls.style.display = 'flex';
    const birdSelection = document.getElementById('birdSelection');
    if (birdSelection) birdSelection.style.display = 'block';
}

function resetGame() {
    gameState = 'READY';
    bird.y = 250;
    bird.velocity = 0;
    bird.rotation = 0;
    score = 0;
    gameSpeed = INITIAL_SPEED;
    pipes = [];
    particles = [];
    frameCount = 0;
    cityX = 0;
    combo = 0;

    // Reset Christmas features
    if (window.CHRISTMAS_MODE) {
        if (typeof presentManager !== 'undefined') presentManager.reset();
        if (typeof comboSystem !== 'undefined') comboSystem.reset();

        if (typeof christmasSounds !== 'undefined') {
            christmasSounds.playBackgroundMusic();
        }
    }

    // Reload high score for current mode
    const scoreKey = window.CHRISTMAS_MODE ? 'keyBirdChristmasHighScore' : 'keyBirdHighScore';
    highScore = parseInt(localStorage.getItem(scoreKey)) || 0;

    play8BitSound('button');

    // Show UI on reset
    const controls = document.querySelector('.mode-controls');
    if (controls) controls.style.display = 'flex';
    const birdSelection = document.getElementById('birdSelection');
    if (birdSelection) birdSelection.style.display = 'block';
}

// ============ GAME OVER ANIMATIONS ============
// Game Over animations are handled in gameOver.js

// ============ RENDERING ============
function drawScore() {
    const x = canvas.width / 2;
    const y = 80;

    // Score number
    drawCartoonText(score.toString(), x, y, 56, '#FFFFFF');

    // Score pop animation
    if (scoreJustIncreased && scoreAnimProgress > 0) {
        const scale = 1 + (0.3 * scoreAnimProgress);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        drawCartoonText(score.toString(), 0, 0, 56, '#FFD700');
        ctx.restore();

        scoreAnimProgress -= 0.1;
        if (scoreAnimProgress <= 0) {
            scoreJustIncreased = false;
        }
    }
}

function drawStartScreen() {
    const centerX = canvas.width / 2;

    // Title
    let titleColor = '#FFD700';
    if (window.CHRISTMAS_MODE) {
        // Candy Cane Gradient
        const gradient = ctx.createLinearGradient(centerX - 100, 0, centerX + 100, 0);
        gradient.addColorStop(0, '#E31C23'); // Red
        gradient.addColorStop(0.25, '#FFFFFF'); // White
        gradient.addColorStop(0.5, '#E31C23');
        gradient.addColorStop(0.75, '#FFFFFF');
        gradient.addColorStop(1, '#E31C23');
        titleColor = gradient;
    }

    // Dynamic Title with Glow and Float
    const floatY = Math.sin(Date.now() / 500) * 8;
    const glowPulse = Math.abs(Math.sin(Date.now() / 1000)) * 15;

    ctx.shadowBlur = 10 + glowPulse;
    ctx.shadowColor = window.CHRISTMAS_MODE ? '#FF0000' : '#FFD700';

    drawCartoonText('KEYBIRD', centerX, 100 + floatY, 40, titleColor);
    ctx.shadowBlur = 0; // Reset

    // Draw Santa Hat on the 'K'
    if (window.CHRISTMAS_MODE) {
        ctx.save();
        ctx.translate(centerX - 110, 65); // Position on top left
        ctx.rotate(-0.2);

        // Hat body
        ctx.fillStyle = '#E31C23';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(15, -25, 30, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke(); // Outline

        // White trim
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-5, 0, 40, 10);
        ctx.strokeRect(-5, 0, 40, 10);

        // Pom pom (animated)
        const bob = Math.sin(Date.now() / 200) * 3;
        ctx.beginPath();
        ctx.arc(30, -25 + bob, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // Tap to start button
    const btnY = canvas.height - 200;
    const pulse = Math.sin(Date.now() / 300) * 0.05 + 1;
    const btnWidth = 280 * pulse;
    const btnHeight = 70 * pulse;

    // Button shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(centerX - btnWidth / 2 + 4, btnY - btnHeight / 2 + 4, btnWidth, btnHeight);

    // Button background
    ctx.shadowBlur = 15;
    ctx.shadowColor = window.CHRISTMAS_MODE ? 'rgba(227, 28, 35, 0.5)' : 'rgba(92, 184, 92, 0.5)';

    if (window.CHRISTMAS_MODE) {
        ctx.fillStyle = '#E31C23'; // Santa Red
    } else {
        ctx.fillStyle = '#5CB85C'; // Original Green
    }
    ctx.fillRect(centerX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight);
    ctx.shadowBlur = 0; // Reset

    // Button outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(centerX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight);

    // Christmas Stitching / Fur Effect
    if (window.CHRISTMAS_MODE) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]); // Stitched look
        ctx.strokeRect(centerX - btnWidth / 2 + 6, btnY - btnHeight / 2 + 6, btnWidth - 12, btnHeight - 12);
        ctx.setLineDash([]); // Reset
    } else {
        // Original Highlight
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - btnWidth / 2 + 10, btnY - btnHeight / 2 + 3);
        ctx.lineTo(centerX + btnWidth / 2 - 10, btnY - btnHeight / 2 + 3);
        ctx.stroke();
    }

    // Button text
    drawCartoonText('TAP TO START', centerX, btnY, 20, '#FFFFFF');

    // High score
    if (highScore > 0) {
        drawCartoonText(`BEST: ${highScore}`, centerX, canvas.height - 100, 16, '#FFD700');
    }
}

// Game Over screen rendering is handled in gameOver.js

function render() {
    // Screen shake effect
    if (shakeIntensity > 0) {
        screenShakeX = (Math.random() - 0.5) * shakeIntensity;
        screenShakeY = (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.9;
        if (shakeIntensity < 0.1) {
            shakeIntensity = 0;
            screenShakeX = 0;
            screenShakeY = 0;
        }
    }

    ctx.save();
    ctx.translate(screenShakeX, screenShakeY);

    // Clear canvas
    ctx.clearRect(-screenShakeX, -screenShakeY, canvas.width, canvas.height);

    // Draw background (Christmas or regular)
    if (window.CHRISTMAS_MODE && typeof drawChristmasBackground !== 'undefined') {
        drawChristmasBackground(ctx, canvas, score);
    } else {
        drawPixelBackground();
    }

    // Draw Christmas lights (if active)
    if (window.CHRISTMAS_MODE && christmasLights) {
        christmasLights.draw(ctx);
    }

    // Draw pipes (Christmas or regular)
    if (window.CHRISTMAS_MODE && typeof drawCandyCanePipe !== 'undefined') {
        pipes.forEach(pipe => drawCandyCanePipe(ctx, pipe));
        if (typeof drawPipeSparkles !== 'undefined') {
            drawPipeSparkles(ctx);
        }
    } else {
        pipes.forEach(pipe => drawPixelPipe(pipe));
    }

    // Draw ground (Christmas snow or regular)
    if (window.CHRISTMAS_MODE && typeof drawSnowGround !== 'undefined') {
        drawSnowGround(ctx, canvas, ground);
    } else {
        drawPixelGround();
    }

    // Draw particles
    drawParticles();

    // Draw snow (if Christmas mode)
    if (window.CHRISTMAS_MODE && typeof snowSystem !== 'undefined') {
        snowSystem.draw(ctx);
    }

    // Draw presents (if Christmas mode) - DISABLED
    // if (window.CHRISTMAS_MODE && typeof presentManager !== 'undefined') {
    //     presentManager.draw(ctx);
    // }

    // Draw floating texts
    floatingTexts.forEach(ft => ft.draw(ctx));

    // Draw bird trail
    birdTrail.forEach((pos, index) => {
        ctx.globalAlpha = index / 10;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(pos.x - 5, pos.y - 5, 10, 10);
    });
    ctx.globalAlpha = 1;

    // Draw bird
    drawPixelBird();

    // Draw combo system (if Christmas mode and playing)
    if (window.CHRISTMAS_MODE && typeof comboSystem !== 'undefined' && gameState === 'PLAYING') {
        comboSystem.draw(ctx, canvas);
    }

    // Draw UI based on state
    if (gameState === 'READY') {
        drawStartScreen();
    } else if (gameState === 'PLAYING') {
        drawScore();
    } else if (gameState === 'GAME_OVER') {
        drawGameOverScreen();
    }

    // Advanced UI Features (Christmas Mode)
    if (window.CHRISTMAS_MODE) {
        if (typeof streakSystem !== 'undefined' && streakSystem) {
            streakSystem.draw(ctx);
        }
        if (typeof achievementSystem !== 'undefined' && achievementSystem) {
            achievementSystem.draw(ctx);
        }
    }

    ctx.restore();
}

// ============ GAME LOOP ============
function updateDifficulty() {
    if (gameState !== 'PLAYING') return;

    // Increase speed based on score
    // Start at 2, max at 5
    // Increase by 0.2 every 5 points
    const targetSpeed = INITIAL_SPEED + Math.min(3, Math.floor(score / 5) * 0.2);

    if (gameSpeed < targetSpeed) {
        gameSpeed += 0.005; // Smooth acceleration
    }
}

function gameLoop() {
    updateDifficulty();
    updateBird();
    updatePipes();
    updateGround();
    updateParticles();

    // Update Christmas features
    // Update Christmas features
    if (window.CHRISTMAS_MODE) {
        if (typeof snowSystem !== 'undefined') snowSystem.update();
        if (typeof comboSystem !== 'undefined') comboSystem.update();
        if (typeof christmasLights !== 'undefined') christmasLights.update();
        if (typeof updatePipeSparkles !== 'undefined') updatePipeSparkles();

        // Advanced features
        if (typeof northernLights !== 'undefined' && northernLights) northernLights.update();
        if (typeof starField !== 'undefined' && starField) starField.update(gameSpeed);
        if (typeof streakSystem !== 'undefined' && streakSystem) streakSystem.update();
        if (typeof achievementSystem !== 'undefined' && achievementSystem) achievementSystem.update();
        if (typeof updateScreenShake !== 'undefined') updateScreenShake();
    }

    // Update 10x features
    if (frameCount % 100 === 0) clouds.push(new Cloud());
    clouds.forEach(cloud => cloud.update());
    clouds = clouds.filter(c => c.x > -100);

    floatingTexts.forEach(ft => ft.update());
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);

    if (gameState === 'PLAYING') {
        birdTrail.push({ x: bird.x, y: bird.y });
        if (birdTrail.length > 10) birdTrail.shift();
        cityX += gameSpeed * 0.25;
    } else {
        birdTrail = [];
    }

    checkCollisions();
    updateGameOverAnimations();
    render();
    frameCount++;
    requestAnimationFrame(gameLoop);
}

// ============ INPUT HANDLING ============
canvas.addEventListener('click', birdFlap);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    birdFlap();
}, { passive: false });

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        birdFlap();
    }
});

// Prevent gestures
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

// ============ MUTE BUTTON ============
const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    muted = !muted;
    localStorage.setItem('keyBirdMuted', muted);

    const soundOn = muteBtn.querySelector('.sound-on');
    const soundOff = muteBtn.querySelector('.sound-off');

    if (muted) {
        soundOn.style.display = 'none';
        soundOff.style.display = 'block';
    } else {
        soundOn.style.display = 'block';
        soundOff.style.display = 'none';
    }

    // Sync with Christmas sounds
    if (window.CHRISTMAS_MODE && typeof christmasSounds !== 'undefined') {
        christmasSounds.setMuted(muted);
    }
});

// ============ INITIALIZATION ============
function init() {
    // Load high score
    const scoreKey = window.CHRISTMAS_MODE ? 'keyBirdChristmasHighScore' : 'keyBirdHighScore';
    highScore = parseInt(localStorage.getItem(scoreKey)) || 0;

    // Load mute preference
    const savedMuted = localStorage.getItem('keyBirdMuted');
    if (savedMuted === 'true') {
        muted = true;
        muteBtn.querySelector('.sound-on').style.display = 'none';
        muteBtn.querySelector('.sound-off').style.display = 'block';
    }

    // Initialize Christmas features if active
    if (window.CHRISTMAS_MODE) {
        console.log('🎄 Christmas Mode Active! 🎅');

        // Initialize snow system
        if (typeof snowSystem !== 'undefined') {
            snowSystem.init(canvas);
        }

        // Initialize Christmas lights
        if (typeof initChristmasLights !== 'undefined') {
            initChristmasLights(canvas);
        }

        // Initialize stars
        if (typeof initStars !== 'undefined') {
            initStars(canvas);
        }

        // Initialize advanced effects (Northern Lights, Star Field, etc.)
        if (typeof initAdvancedEffects !== 'undefined') {
            initAdvancedEffects(canvas);
        }

        // Sync mute state with Christmas sounds
        if (typeof christmasSounds !== 'undefined') {
            christmasSounds.setMuted(muted);
        }
    }

    // Start game loop
    gameLoop();
}

// Start the game
init();
