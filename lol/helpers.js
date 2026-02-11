import { SLOTS_PER_SIGNAL } from './index.js';

/**
 * LOL Helpers - Universal signal transformations
 * Designed for maximum performance with direct `s.state[index]` access.
 * Each stateful helper uses specific indices within `s.state`.
 * The engine guarantees `s.state` is initialized to zeros on cold start.
 */

// ============================================================================
// MODULATION
// ============================================================================

/**
 * Tremolo (amplitude LFO).
 * STATEFUL: Uses `s.state[0]` for its internal LFO phase.
 * @param {Function} signal - Input signal.
 * @param {number} rate - LFO rate in Hz.
 * @param {number} depth - Modulation depth (0-1).
 * @returns {Function} Tremolo signal.
 */
export const tremolo = (signal, rate, depth = 0.5) => {
  return s => {
    s.state[0] = (s.state[0] + rate / s.sr) % 1.0;
    const lfo = (Math.sin(s.state[0] * 2 * Math.PI) + 1) * 0.5;
    return signal(s) * (1 - depth + lfo * depth);
  };
};

// ============================================================================
// FILTERING
// ============================================================================

/**
 * One-pole lowpass filter.
 * STATEFUL: Uses `s.state[0]` for its internal filter state (z1).
 * @param {Function} signal - Input signal
 * @param {number|Function} cutoff - Cutoff frequency in Hz or function
 * @returns {Function} Filtered signal
 */
export const lowpass = (signal, cutoff) => {
  const cutoffFn = typeof cutoff === 'function' ? cutoff : () => cutoff;
  return s => {
    const alpha = cutoffFn(s) / s.sr;
    const input = signal(s);
    s.state[0] = s.state[0] + alpha * (input - s.state[0]);
    return s.state[0];
  };
};

// ============================================================================
// DELAY & FEEDBACK
// ============================================================================

/**
 * Simple delay (no feedback).
 * STATEFUL: Uses `s.state[0]` for write cursor, and `s.state[1]` onwards for the delay buffer.
 * Max delay is limited by `SLOTS_PER_SIGNAL - 1` samples (~2.6ms @ 48kHz).
 * @param {Function} signal - Input signal
 * @param {number|Function} time - Delay time in seconds or function
 * @returns {Function} Delayed signal
 */
export const delay = (signal, time) => {
  const timeFn = typeof time === 'function' ? time : () => time;
  return s => {
    let writeCursor = s.state[0];
    const bufferLength = SLOTS_PER_SIGNAL - 1;
    s.state[1 + writeCursor] = signal(s);
    const delaySamples = Math.floor(timeFn(s) * s.sr);
    const readIdx = (writeCursor - delaySamples + bufferLength) % bufferLength;
    const output = s.state[1 + readIdx];
    s.state[0] = (writeCursor + 1) % bufferLength;
    return output;
  };
};

// ============================================================================
// Stateless (pure) helpers
// ============================================================================
export const gain = (signal, amount) => {
  const gainFn = typeof amount === 'function' ? amount : () => amount;
  return s => signal(s) * gainFn(s);
};
export const pan = (signal, position) => {
  const posFn = typeof position === 'function' ? position : () => position;
  return s => {
    const value = signal(s);
    const pos = Math.max(-1, Math.min(1, posFn(s)));
    const angle = (pos + 1) * Math.PI / 4;
    return [value * Math.cos(angle), value * Math.sin(angle)];
  };
};