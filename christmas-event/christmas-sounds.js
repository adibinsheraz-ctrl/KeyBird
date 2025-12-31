/* ===================================
   CHRISTMAS SOUND SYSTEM
   Holiday sound effects using Web Audio API
   =================================== */

const christmasSounds = {
    audioContext: null,
    muted: false,

    init() {
        // Create audio context
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        this.audioContext = window.audioContext;

        // Check mute state from main game
        if (typeof muted !== 'undefined') {
            this.muted = muted;
        }
    },

    // Jingle bells for bird flap
    playJingleFlap() {
        if (this.muted || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const config = window.christmasConfig?.audio || { sfxVolume: 0.5 };

        // Two quick bell tones (jingle)
        [523.25, 659.25].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.2 * config.sfxVolume, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);

            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.1);
        });
    },

    // Ho Ho Ho laugh (synthesized)
    playHoHoHo() {
        if (this.muted || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const config = window.christmasConfig?.audio || { sfxVolume: 0.5 };

        // Three "HO" sounds (descending pitch)
        [200, 180, 160].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            const startTime = now + i * 0.2;
            gain.gain.setValueAtTime(0.15 * config.sfxVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    },

    // Sleigh bells for scoring
    playSleighBells() {
        if (this.muted || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const config = window.christmasConfig?.audio || { sfxVolume: 0.5 };

        // Ascending bell melody
        [523.25, 587.33, 659.25, 698.46, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'triangle'; // Bell-like sound
            osc.frequency.value = freq;

            const startTime = now + i * 0.08;
            gain.gain.setValueAtTime(0.15 * config.sfxVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    },

    // Present collect chime
    playPresentCollect() {
        if (this.muted || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const config = window.christmasConfig?.audio || { sfxVolume: 0.5 };

        // Magical sparkle sound
        [1046.50, 1318.51, 1567.98].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.2 * config.sfxVolume, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);

            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.15);
        });
    },

    // Snowball hit (collision sound)
    playSnowballHit() {
        if (this.muted || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const config = window.christmasConfig?.audio || { sfxVolume: 0.5 };

        // White noise burst
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = ctx.createBufferSource();
        const gain = ctx.createGain();

        noise.buffer = buffer;
        noise.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.2 * config.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.start(now);
    },

    bgmTimeout: null,
    activeOscillators: [],

    // Clean up all active sounds (stop immediately)
    stopAllSounds() {
        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
            this.bgmTimeout = null;
        }

        this.activeOscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) { }
        });
        this.activeOscillators = [];
    },

    // Jingle bells for bird flap (with variation)
    playJingleFlap() {
        if (this.muted || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const config = window.christmasConfig?.audio || { sfxVolume: 0.5 };

        // Pitch variation for natural feel
        const detune = (Math.random() - 0.5) * 50; // +/- 50 cents

        // Two quick bell tones (jingle)
        [523.25, 659.25].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.detune.value = detune;

            // Smoother envelope
            gain.gain.setValueAtTime(0, now + i * 0.05);
            gain.gain.linearRampToValueAtTime(0.2 * config.sfxVolume, now + i * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);

            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.2);
        });
    },

    // ... (Other SFX like playHoHoHo, playSleighBells kept similar or updated if needed. 
    // I only see playJingleFlap in the replace range if I target correctly? 
    // Wait, the user wants "sound automatically stops". I need to replace the BGM logic mainly.
    // I'll skip replacing playJingleFlap here to focus on BGM structure first, or include it if range permits.)

    // Background Christmas music (simple jingle bells melody loop)
    playBackgroundMusic() {
        if (this.muted || !this.audioContext) return;

        // Don't overlap multiple BGMs
        if (this.bgmTimeout) clearTimeout(this.bgmTimeout);

        const config = window.christmasConfig?.audio || { backgroundMusicVolume: 0.3 };
        if (!config.backgroundMusicVolume || config.backgroundMusicVolume === 0) return;

        const ctx = this.audioContext;

        // Jingle Bells melody (simplified)
        const melody = [
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.5 },
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.25 },
            { note: 'E5', duration: 0.5 },
            { note: 'E5', duration: 0.25 },
            { note: 'G5', duration: 0.25 },
            { note: 'C5', duration: 0.25 },
            { note: 'D5', duration: 0.25 },
            { note: 'E5', duration: 1 }
        ];

        // Note frequencies
        const notes = {
            'C5': 523.25,
            'D5': 587.33,
            'E5': 659.25,
            'F5': 698.46,
            'G5': 783.99
        };

        let time = ctx.currentTime;
        const now = ctx.currentTime;

        melody.forEach(({ note, duration }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine'; // Softer tone than square
            osc.frequency.value = notes[note];

            // Smoother attack and release
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.05 * config.backgroundMusicVolume, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.05);

            osc.start(time);
            osc.stop(time + duration);

            this.activeOscillators.push(osc);
            // Cleanup oscillator from list after it stops
            osc.onended = () => {
                const idx = this.activeOscillators.indexOf(osc);
                if (idx > -1) this.activeOscillators.splice(idx, 1);
            };

            time += duration;
        });

        // Loop after melody finishes
        const loopDelay = (time - now) * 1000;
        this.bgmTimeout = setTimeout(() => {
            // Check global game state if available, or just rely on manual stop
            // But we specifically check if NOT game over? 
            // Better to rely on game.js calling stopBackgroundMusic()
            if (window.CHRISTMAS_MODE && !this.muted) {
                this.playBackgroundMusic();
            }
        }, loopDelay);
    },

    setMuted(isMuted) {
        this.muted = isMuted;
        if (isMuted) {
            this.stopAllSounds();
        } else if (window.CHRISTMAS_MODE) {
            // Restart BGM if unmuted
            this.playBackgroundMusic();
        }
    }
};

// Initialize when Christmas mode is active
if (window.CHRISTMAS_MODE) {
    christmasSounds.init();

    // Start background music after a short delay
    setTimeout(() => {
        if (window.christmasConfig?.audio?.backgroundMusicVolume > 0) {
            christmasSounds.playBackgroundMusic();
        }
    }, 1000);
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = christmasSounds;
}
