/* ===================================
   ACHIEVEMENT SYSTEM
   Unlock achievements and show satisfying popups
   =================================== */

class AchievementSystem {
    constructor() {
        this.achievements = {
            firstFlight: {
                id: 'firstFlight',
                name: 'First Flight',
                description: 'Pass your first pipe',
                icon: '🎄',
                requirement: 1,
                unlocked: false
            },
            jingleWay: {
                id: 'jingleWay',
                name: 'Jingle All The Way',
                description: 'Pass 10 pipes',
                icon: '🔔',
                requirement: 10,
                unlocked: false
            },
            santaHelper: {
                id: 'santaHelper',
                name: "Santa's Helper",
                description: 'Pass 25 pipes',
                icon: '🎅',
                requirement: 25,
                unlocked: false
            },
            christmasMaster: {
                id: 'christmasMaster',
                name: 'Christmas Master',
                description: 'Pass 50 pipes',
                icon: '⭐',
                requirement: 50,
                unlocked: false
            },
            perfectLanding: {
                id: 'perfectLanding',
                name: 'Perfect Century',
                description: 'Score exactly 100',
                icon: '💯',
                requirement: 100,
                unlocked: false
            }
        };

        this.loadProgress();
        this.activePopups = [];
    }

    loadProgress() {
        const saved = localStorage.getItem('christmas_achievements');
        if (saved) {
            const progress = JSON.parse(saved);
            Object.keys(progress).forEach(key => {
                if (this.achievements[key]) {
                    this.achievements[key].unlocked = progress[key];
                }
            });
        }
    }

    saveProgress() {
        const progress = {};
        Object.keys(this.achievements).forEach(key => {
            progress[key] = this.achievements[key].unlocked;
        });
        localStorage.setItem('christmas_achievements', JSON.stringify(progress));
    }

    checkAchievements(score) {
        // Check score-based achievements
        Object.values(this.achievements).forEach(achievement => {
            if (!achievement.unlocked && score >= achievement.requirement) {
                // Special case for perfect landing
                if (achievement.id === 'perfectLanding' && score !== 100) {
                    return;
                }

                this.unlock(achievement);
            }
        });
    }

    unlock(achievement) {
        achievement.unlocked = true;
        this.saveProgress();
        this.showPopup(achievement);

        // Play sound
        if (typeof christmasSounds !== 'undefined' && christmasSounds.playSleighBells) {
            try {
                christmasSounds.playSleighBells();
            } catch (e) {
                console.warn('Could not play achievement sound');
            }
        }
    }

    showPopup(achievement) {
        this.activePopups.push({
            achievement: achievement,
            y: -100,
            targetY: 80,
            life: 180, // 3 seconds
            maxLife: 180,
            scale: 0
        });
    }

    update() {
        for (let i = this.activePopups.length - 1; i >= 0; i--) {
            const popup = this.activePopups[i];

            // Slide in animation
            if (popup.y < popup.targetY) {
                popup.y += (popup.targetY - popup.y) * 0.2;
            }

            // Scale animation
            if (popup.scale < 1) {
                popup.scale += 0.1;
            }

            // Countdown
            popup.life--;

            // Slide out
            if (popup.life < 30) {
                popup.y -= 2;
            }

            // Remove
            if (popup.life <= 0) {
                this.activePopups.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.activePopups.forEach(popup => {
            const achievement = popup.achievement;
            const alpha = popup.life < 30 ? popup.life / 30 : 1;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(canvas.width / 2, popup.y);
            ctx.scale(popup.scale, popup.scale);

            // Background
            ctx.fillStyle = '#0F7D3A';
            ctx.fillRect(-150, -35, 300, 70);

            // Border
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.strokeRect(-150, -35, 300, 70);

            // Achievement unlocked text
            ctx.font = '10px "Press Start 2P"';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.fillText('ACHIEVEMENT UNLOCKED!', 0, -15);

            // Icon
            ctx.font = '24px Arial';
            ctx.fillText(achievement.icon, -100, 10);

            // Name
            ctx.font = 'bold 14px "Press Start 2P"';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.fillText(achievement.name, -70, 5);

            // Description
            ctx.font = '8px "Press Start 2P"';
            ctx.fillStyle = '#CCCCCC';
            ctx.fillText(achievement.description, -70, 20);

            ctx.restore();
        });
    }

    getUnlockedCount() {
        return Object.values(this.achievements).filter(a => a.unlocked).length;
    }

    getTotalCount() {
        return Object.keys(this.achievements).length;
    }

    reset() {
        // Don't reset achievements - they persist across games
    }
}

// Initialize achievement system
const achievementSystem = new AchievementSystem();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = achievementSystem;
}

console.log('🏆 Achievement System Loaded!');
