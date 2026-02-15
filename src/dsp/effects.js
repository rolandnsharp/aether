// Aither DSP — Stateful effects (stride-agnostic via expand).

import { expand } from './state.js';

// --- Tremolo ---
const tremolo_mono = (s, input, mem, addr, chan, rate, depth) => {
    if (chan === 0) {
        mem[addr] = (mem[addr] + rate / s.sr) % 1.0;
    }
    const lfo = (Math.sin(mem[addr] * 2 * Math.PI) + 1) * 0.5;
    const mod = 1 - depth + lfo * depth;
    return input * mod;
};
export const tremolo = expand(tremolo_mono, 'tremolo', 1);

// --- Lowpass Filter ---
const lowpass_mono = (s, input, mem, addr, _chan, cutoff) => {
    const cutoffFn = typeof cutoff === 'function' ? cutoff : () => cutoff;
    const alpha = Math.min(1, Math.max(0, cutoffFn(s) / s.sr));
    const z1 = mem[addr] || 0;
    const output = z1 + alpha * (input - z1);
    mem[addr] = output;
    return output;
};
export const lowpass = expand(lowpass_mono, 'lowpass', 1);

// --- Highpass Filter ---
// Subtract the lowpassed signal from the input.
const highpass_mono = (s, input, mem, addr, _chan, cutoff) => {
    const cutoffFn = typeof cutoff === 'function' ? cutoff : () => cutoff;
    const alpha = Math.min(1, Math.max(0, cutoffFn(s) / s.sr));
    const z1 = mem[addr] || 0;
    const lp = z1 + alpha * (input - z1);
    mem[addr] = lp;
    return input - lp;
};
export const highpass = expand(highpass_mono, 'highpass', 1);

// --- Delay ---
const delay_mono = (s, input, mem, addr, _chan, maxTime, time) => {
    const bufferLength = Math.floor(maxTime * s.sr);
    const cursorSlot = addr;
    const bufferStart = addr + 1;

    const timeFn = typeof time === 'function' ? time : () => time;
    const delaySamples = Math.min(bufferLength - 1, Math.floor(timeFn(s) * s.sr));

    let writeCursor = Math.floor(mem[cursorSlot]);
    if (isNaN(writeCursor) || writeCursor < 0 || writeCursor >= bufferLength) writeCursor = 0;

    mem[bufferStart + writeCursor] = input;

    const readCursor = (writeCursor - delaySamples + bufferLength) % bufferLength;
    const output = mem[bufferStart + readCursor];

    mem[cursorSlot] = (writeCursor + 1) % bufferLength;
    return output;
};
export const delay = expand(delay_mono, 'delay', (maxTime) => 1 + Math.floor(maxTime * 48000));

// --- Feedback Delay ---
const feedback_mono = (s, input, mem, addr, _chan, maxTime, time, feedbackAmt) => {
    const bufferLength = Math.floor(maxTime * s.sr);
    const cursorSlot = addr;
    const bufferStart = addr + 1;

    const timeFn = typeof time === 'function' ? time : () => time;
    const feedbackFn = typeof feedbackAmt === 'function' ? feedbackAmt : () => feedbackAmt;

    const delaySamples = Math.min(bufferLength - 1, Math.floor(timeFn(s) * s.sr));
    const fbAmt = feedbackFn(s);

    let writeCursor = Math.floor(mem[cursorSlot]);
    if (isNaN(writeCursor) || writeCursor < 0 || writeCursor >= bufferLength) writeCursor = 0;

    const readCursor = (writeCursor - delaySamples + bufferLength) % bufferLength;
    const delayedSample = mem[bufferStart + readCursor] || 0;

    const output = input + delayedSample * fbAmt;
    mem[bufferStart + writeCursor] = output;

    mem[cursorSlot] = (writeCursor + 1) % bufferLength;
    return output;
};
export const feedback = expand(feedback_mono, 'feedback', (maxTime) => 1 + Math.floor(maxTime * 48000));

// --- Reverb (Schroeder/Freeverb) ---
// 4 parallel comb filters with damping + 2 series allpass filters.
const COMB_LENGTHS = [1557, 1617, 1491, 1422];
const ALLPASS_LENGTHS = [225, 556];
const ALLPASS_FEEDBACK = 0.5;

const REVERB_SLOTS = COMB_LENGTHS.reduce((sum, len) => sum + 2 + len, 0)
                   + ALLPASS_LENGTHS.reduce((sum, len) => sum + 1 + len, 0);

const reverb_mono = (s, input, mem, addr, _chan, time, damping, mix) => {
    const rt60 = Math.max(typeof time === 'function' ? time(s) : time, 0.001);
    const damp = Math.max(0, Math.min(1, typeof damping === 'function' ? damping(s) : damping));
    const mixVal = typeof mix === 'function' ? mix(s) : mix;

    let offset = addr;
    let combSum = 0;

    for (let c = 0; c < 4; c++) {
        const bufLen = COMB_LENGTHS[c];
        const cursorSlot = offset;
        const dampSlot = offset + 1;
        const bufStart = offset + 2;
        offset += 2 + bufLen;

        let cursor = Math.floor(mem[cursorSlot]);
        if (isNaN(cursor) || cursor < 0 || cursor >= bufLen) cursor = 0;

        let output = mem[bufStart + cursor];
        if (!isFinite(output)) output = 0;

        // One-pole lowpass in feedback path for high-frequency damping
        let prevDamp = mem[dampSlot];
        if (!isFinite(prevDamp)) prevDamp = 0;
        const filterStore = output * (1 - damp) + prevDamp * damp;
        mem[dampSlot] = filterStore;

        // Feedback gain derived from RT60: -60dB at rt60 seconds
        const g = Math.pow(10, -3 * bufLen / (rt60 * s.sr));

        mem[bufStart + cursor] = input + filterStore * g;
        mem[cursorSlot] = (cursor + 1) % bufLen;

        combSum += output;
    }

    // 2 series allpass filters for echo density
    let out = combSum;
    for (let a = 0; a < 2; a++) {
        const bufLen = ALLPASS_LENGTHS[a];
        const cursorSlot = offset;
        const bufStart = offset + 1;
        offset += 1 + bufLen;

        let cursor = Math.floor(mem[cursorSlot]);
        if (isNaN(cursor) || cursor < 0 || cursor >= bufLen) cursor = 0;

        let bufout = mem[bufStart + cursor];
        if (!isFinite(bufout)) bufout = 0;
        mem[bufStart + cursor] = out + bufout * ALLPASS_FEEDBACK;
        out = bufout - out;

        mem[cursorSlot] = (cursor + 1) % bufLen;
    }

    const wet = out * 0.25;
    return input * (1 - mixVal) + wet * mixVal;
};
export const reverb = expand(reverb_mono, 'reverb', REVERB_SLOTS);
