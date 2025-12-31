/* ===================================
   GAME OVER UI & LOGIC
   Handles the game over screen, animations, and medals
   =================================== */

// Global variables expected from game.js:
// ctx, canvas, score, highScore, isNewRecord, overlayAlpha, panelY, 
// panelSlideSpeed, panelBounce, displayScore, medalScale, medalRotation,
// newRecordBadgeScale, panelSoundPlayed, medalSoundPlayed

// Stamping animation variables
let stampProgress = 0; // 0 to 1, controls the stamp animation
let stampSquash = 1; // Squash effect when stamping
let stampImpact = 0; // Impact flash effect
let stampParticles = []; // Ink splatter particles

function updateGameOverAnimations() {
    if (gameState !== 'GAME_OVER') return;

    try {
        // Fade in overlay
        if (overlayAlpha < 0.6) {
            overlayAlpha += 0.04;
        }

        // Slide panel down
        if (panelY < 150) {
            panelY += panelSlideSpeed;
            panelSlideSpeed += 1; // Gravity acceleration

            // Play whoosh sound when panel starts sliding
            if (!panelSoundPlayed && panelY > -250) {
                play8BitSound('whoosh');
                panelSoundPlayed = true;
            }

            if (panelY >= 150) {
                panelY = 150;
                panelBounce = 15;
            }
        }

        // Bounce animation
        if (panelBounce > 0) {
            panelY -= panelBounce;
            panelBounce *= 0.7;
            if (panelBounce < 0.5) panelBounce = 0;
        }

        // Count up score
        if (displayScore < score) {
            displayScore += Math.ceil((score - displayScore) / 10);
            if (displayScore > score) displayScore = score;
        }

        // Medal stamping animation
        if (getMedal(score)) {
            if (stampProgress < 1) {
                // Fast stamp down
                stampProgress += 0.15;

                if (stampProgress >= 1) {
                    stampProgress = 1;
                    stampImpact = 1; // Trigger impact flash
                    stampSquash = 0.7; // Squash on impact

                    // Play stamp sound
                    if (!medalSoundPlayed) {
                        play8BitSound('medal');
                        medalSoundPlayed = true;
                    }

                    // Create ink splatter particles
                    createStampParticles();
                }
            } else {
                // Recover from squash
                if (stampSquash < 1) {
                    stampSquash += 0.1;
                    if (stampSquash > 1) stampSquash = 1;
                }
            }

            // Update medal scale based on stamp progress
            medalScale = stampProgress * stampSquash;
        }

        // Update stamp impact flash
        if (stampImpact > 0) {
            stampImpact -= 0.1;
            if (stampImpact < 0) stampImpact = 0;
        }

        // Update stamp particles
        for (let i = stampParticles.length - 1; i >= 0; i--) {
            stampParticles[i].life--;
            stampParticles[i].x += stampParticles[i].vx;
            stampParticles[i].y += stampParticles[i].vy;
            stampParticles[i].vy += 0.2; // Gravity

            if (stampParticles[i].life <= 0) {
                stampParticles.splice(i, 1);
            }
        }

        // NEW badge animation
        if (isNewRecord && newRecordBadgeScale < 1) {
            newRecordBadgeScale += 0.15;
            if (newRecordBadgeScale > 1) newRecordBadgeScale = 1;
        }
    } catch (e) {
        console.error("Error in updateGameOverAnimations:", e);
    }
}

function drawGameOverScreen() {
    try {
        // Darken overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center the panel properly
        const panelX = (canvas.width - 300) / 2;
        const panelWidth = 300;
        const panelHeight = 280;

        // Panel shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(panelX + 6, panelY + 6, panelWidth, panelHeight);

        // Panel background
        ctx.fillStyle = '#FAEBD7';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Panel border
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 6;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Inner border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX + 10, panelY + 10, panelWidth - 20, panelHeight - 20);

        // Game Over title
        const titleY = panelY - 40;
        const wiggle = Math.sin(Date.now() / 100) * 2;

        ctx.save();
        ctx.translate(canvas.width / 2, titleY);
        ctx.rotate(wiggle * Math.PI / 180);

        ctx.fillStyle = '#DC143C';
        ctx.fillRect(-120, -20, 240, 40);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(-120, -20, 240, 40);

        drawCartoonText('GAME OVER', 0, 0, 24, '#FFFFFF');
        ctx.restore();

        // Scores
        const centerX = canvas.width / 2;
        const baseY = panelY + 100;

        drawCartoonText('SCORE', centerX, baseY, 16, '#8B7355');
        drawCartoonText(displayScore.toString(), centerX, baseY + 35, 32, '#000000');

        drawCartoonText('BEST', centerX, baseY + 90, 16, '#8B7355');
        // Show gold for best score, unless it's a new record (then show red)
        const bestColor = isNewRecord ? '#FF0000' : '#FFD700';
        drawCartoonText(highScore.toString(), centerX, baseY + 125, 32, bestColor);

        // NEW! badge for new record
        if (isNewRecord && newRecordBadgeScale > 0) {
            try {
                drawNewRecordBadge(centerX + 80, baseY + 125);
            } catch (e) {
                console.error("Error drawing badge:", e);
            }
        }

        // Medal (positioned on left side of panel)
        const medal = getMedal(score);
        if (medal && medalScale > 0) {
            try {
                // Draw stamp particles first (behind medal)
                drawStampParticles(ctx);

                // Draw impact flash
                if (stampImpact > 0) {
                    ctx.save();
                    ctx.globalAlpha = stampImpact * 0.3;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(panelX + 80, baseY + 60, 60 * stampImpact, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                drawMedal(panelX + 80, baseY + 60, medal);
            } catch (e) {
                console.error("Error drawing medal:", e);
            }
        }

        // Play again button
        const btnY = panelY + panelHeight - 50;
        ctx.fillStyle = '#5CB85C';
        ctx.fillRect(centerX - 100, btnY - 25, 200, 50);
        ctx.strokeStyle = '#2C662C';
        ctx.lineWidth = 4;
        ctx.strokeRect(centerX - 100, btnY - 25, 200, 50);

        drawCartoonText('PLAY AGAIN', centerX, btnY, 16, '#FFFFFF');

    } catch (e) {
        // Emergency fallback if main panel fails
        console.error("CRITICAL ERROR in drawGameOverScreen:", e);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText("Tap to Play Again", canvas.width / 2, canvas.height / 2 + 50);
    }
}

function getMedal(score) {
    if (score >= 30) return 'gold';
    if (score >= 20) return 'silver';
    if (score >= 10) return 'bronze';
    return null;
}

function drawMedal(x, y, type) {
    const colors = {
        bronze: { base: '#CD7F32', highlight: '#E89C5C', shadow: '#8B5A2B', ribbon: '#8B4513' },
        silver: { base: '#C0C0C0', highlight: '#E0E0E0', shadow: '#808080', ribbon: '#696969' },
        gold: { base: '#FFD700', highlight: '#FFED4E', shadow: '#B8860B', ribbon: '#DAA520' }
    };

    const ranks = {
        bronze: { number: '3', label: 'BRONZE', minScore: 10 },
        silver: { number: '2', label: 'SILVER', minScore: 20 },
        gold: { number: '1', label: 'GOLD', minScore: 30 }
    };

    const color = colors[type];
    const rank = ranks[type];
    const medalSize = 50 * medalScale;

    ctx.save();
    ctx.translate(x, y);

    // Draw ribbon (behind the medal)
    ctx.fillStyle = color.ribbon;
    ctx.fillRect(-8, medalSize / 2 - 10, 16, 35);
    ctx.fillStyle = color.shadow;
    ctx.fillRect(-8, medalSize / 2 - 10, 6, 35);

    // Ribbon ends (V-shape)
    ctx.fillStyle = color.ribbon;
    ctx.beginPath();
    ctx.moveTo(-8, medalSize / 2 + 20);
    ctx.lineTo(-8, medalSize / 2 + 25);
    ctx.lineTo(-4, medalSize / 2 + 22);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(8, medalSize / 2 + 20);
    ctx.lineTo(8, medalSize / 2 + 25);
    ctx.lineTo(4, medalSize / 2 + 22);
    ctx.fill();

    // Apply squash/stretch for stamping effect
    ctx.scale(1 / stampSquash, stampSquash);


    // Draw star shape instead of circle
    const spikes = 5;
    const outerRadius = medalSize / 2;
    const innerRadius = medalSize / 4;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();

    // Star shadow
    ctx.fillStyle = color.shadow;
    ctx.fill();

    // Star base color
    ctx.fillStyle = color.base;
    ctx.fill();

    // Star outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Star highlight
    ctx.strokeStyle = color.highlight;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner circle for rank number
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, medalSize / 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rank number
    ctx.font = `bold ${Math.floor(medalSize / 2.5)}px "Press Start 2P", monospace`;
    ctx.fillStyle = color.base;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rank.number, 0, 0);

    // Add black outline to number
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(rank.number, 0, 0);

    ctx.restore();

    // Medal label below (not rotated)
    ctx.save();
    ctx.translate(x, y + medalSize / 2 + 35);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = color.base;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Black outline for label
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(rank.label, 0, 0);

    // Label text
    ctx.fillText(rank.label, 0, 0);
    ctx.restore();
}

function drawNewRecordBadge(x, y) {
    const badgeWidth = 60;
    const badgeHeight = 24;
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.1;

    // Safety check
    if (!isFinite(x) || !isFinite(y) || !isFinite(newRecordBadgeScale)) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse * newRecordBadgeScale, pulse * newRecordBadgeScale);

    // Badge background (bright red)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight);

    // Badge outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight);

    // "NEW!" text
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEW!', 0, 0);

    ctx.restore();
}

// Helper function to create stamp particles
function createStampParticles() {
    // Get medal position from the game over screen
    const panelX = (canvas.width - 300) / 2;
    const baseY = 150 + 100; // panelY + 100
    const medalX = panelX + 80;
    const medalY = baseY + 60;

    // Create ink splatter particles around the medal
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 / particleCount) * i;
        const speed = 2 + Math.random() * 3;
        const size = 3 + Math.random() * 4;

        stampParticles.push({
            x: medalX,
            y: medalY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1, // Slight upward bias
            life: 20 + Math.floor(Math.random() * 10),
            maxLife: 30,
            size: size,
            color: 'rgba(0, 0, 0, 0.4)' // Dark ink color
        });
    }
}

// Helper function to draw stamp particles
function drawStampParticles(ctx) {
    stampParticles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
        );
        ctx.restore();
    });
}
