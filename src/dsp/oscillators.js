// Aither DSP — Phase-continuous oscillators.
//
// Mono signal sources. Each uses 1 slot in helper memory for its
// phase accumulator. Stereo comes from composition:
//   pan(sin(440), -0.3)
//
// Frequency args accept a number or a function of s for modulation:
//   sin(440)
//   sin(s => 440 + mod(s) * 200)

import { claimStateBlock, nextHelperIndex } from './state.js';

const TAU = 2 * Math.PI;
const mem = globalThis.LEL_HELPER_MEMORY;

// --- Sine ---
export const sin = (freq) => {
    const idx = nextHelperIndex();
    return s => {
        const addr = claimStateBlock(s, 'sin', idx, 1);
        const f = typeof freq === 'function' ? freq(s) : freq;
        mem[addr] = (mem[addr] + f / s.sr) % 1.0;
        return Math.sin(mem[addr] * TAU);
    };
};

// --- Sawtooth ---
export const saw = (freq) => {
    const idx = nextHelperIndex();
    return s => {
        const addr = claimStateBlock(s, 'saw', idx, 1);
        const f = typeof freq === 'function' ? freq(s) : freq;
        mem[addr] = (mem[addr] + f / s.sr) % 1.0;
        return mem[addr] * 2 - 1;
    };
};

// --- Triangle ---
export const tri = (freq) => {
    const idx = nextHelperIndex();
    return s => {
        const addr = claimStateBlock(s, 'tri', idx, 1);
        const f = typeof freq === 'function' ? freq(s) : freq;
        mem[addr] = (mem[addr] + f / s.sr) % 1.0;
        return Math.abs(mem[addr] * 4 - 2) - 1;
    };
};

// --- Square ---
export const square = (freq) => {
    const idx = nextHelperIndex();
    return s => {
        const addr = claimStateBlock(s, 'square', idx, 1);
        const f = typeof freq === 'function' ? freq(s) : freq;
        mem[addr] = (mem[addr] + f / s.sr) % 1.0;
        return mem[addr] < 0.5 ? 1 : -1;
    };
};

// --- Pulse (variable duty cycle) ---
export const pulse = (freq, width) => {
    const idx = nextHelperIndex();
    return s => {
        const addr = claimStateBlock(s, 'pulse', idx, 1);
        const f = typeof freq === 'function' ? freq(s) : freq;
        const w = typeof width === 'function' ? width(s) : width;
        mem[addr] = (mem[addr] + f / s.sr) % 1.0;
        return mem[addr] < w ? 1 : -1;
    };
};

// --- White Noise (stateless) ---
export const noise = () => _s => Math.random() * 2 - 1;
