// NovaSudoku Sound Engine - Zero-dependency Web Audio synthesizer

let audioCtx = null;
let soundEnabled = true;

try {
    const saved = localStorage.getItem('nova-sound-enabled');
    if (saved !== null) {
        soundEnabled = saved === 'true';
    }
} catch {
    // ignore local storage restrictions
}

function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function isSoundEnabled() {
    return soundEnabled;
}

export function toggleSound() {
    soundEnabled = !soundEnabled;
    try {
        localStorage.setItem('nova-sound-enabled', String(soundEnabled));
    } catch {
        // ignore
    }
    if (soundEnabled) {
        playDigitSound('5');
    }
    return soundEnabled;
}

export function playDigitSound(digit = '1') {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Harmonious pentatonic scale frequencies based on digit 1-9
        const baseFreq = 329.63; // E4
        const semitones = [0, 2, 4, 7, 9, 12, 14, 16, 19];
        const num = parseInt(digit, 10);
        const st = (num >= 1 && num <= 9) ? semitones[num - 1] : 7;
        const freq = baseFreq * Math.pow(2, st / 12);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.13);
    } catch {
        // Audio policy or unsupported
    }
}

export function playPencilSound() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(740, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.06);
    } catch {
        // ignore
    }
}

export function playEraseSound() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.09);
    } catch {
        // ignore
    }
}

export function playErrorSound() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.setValueAtTime(140, ctx.currentTime + 0.07);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.16);
    } catch {
        // ignore
    }
}

export function playVictoryFanfare() {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Uplifting ascending major arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            const startTime = ctx.currentTime + (i * 0.09);
            const duration = i === notes.length - 1 ? 0.7 : 0.22;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.09, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
        });
    } catch {
        // ignore
    }
}
