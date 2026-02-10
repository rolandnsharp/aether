/**
 * Zap (⚡) - The Lightning Paradigm
 *
 * The ultimate unified synthesis paradigm.
 * ONE signature: s => value
 *
 * ⚡ represents "the state of the universe at this moment":
 * - State (looks like S!)
 * - Tesla's electromagnetic fields
 * - Energy, power, instant transmission
 *
 * Philosophy:
 * No artificial boundaries between paradigms.
 * Pure time, stateful evolution, spatial fields—all unified.
 * Maximum flexibility through composition.
 */

import { registry } from '../../aether.js';
import * as helpers from './helpers.js';

/**
 * Persistent state storage (survives hot-reloads)
 */
globalThis.ZAP_STATES ??= new Map();
const zapStates = globalThis.ZAP_STATES;

/**
 * The Universal State Object (⚡)
 *
 * Contains everything you need for synthesis:
 * - Time (t, dt)
 * - Audio context (idx, sr)
 * - Space (position)
 * - User state (anything you add)
 */
export function createState(options = {}) {
  return {
    // TIME
    t: options.t || 0,           // Absolute time (seconds)
    dt: options.dt || 1/48000,   // Time delta

    // AUDIO
    idx: options.idx || 0,       // Sample index
    sr: options.sr || 48000,     // Sample rate

    // SPACE
    position: options.position || { x: 0, y: 0, z: 0 },

    // USER STATE
    // User can add anything here
    ...options.state
  };
}

/**
 * Internal registry for Zap signal metadata (separate from audio engine)
 */
const zapMetadata = new Map();

/**
 * Register a Zap signal with the audio engine
 *
 * @param {string} name - Signal name
 * @param {Function} fn - Signal function: s => value
 * @param {Object} options - Configuration
 * @returns {Object} Registered signal
 */
export function register(name, fn, options = {}) {
  // Get or create persistent state (survives hot-reloads)
  // This is the key difference from a naive implementation:
  // State persists in globalThis.ZAP_STATES across hot-reloads
  let state = zapStates.get(name);
  if (!state) {
    state = createState(options.initialState);
    zapStates.set(name, state);
    console.log(`[ZAP] Created new state for: "${name}"`);
  } else {
    console.log(`[ZAP] Reusing existing state for: "${name}"`);
  }

  // Wrap Zap function in standard signal interface for audio engine
  const signal = {
    update: (context) => {
      // Update state from context
      state.t = context.t;
      state.dt = context.dt;
      state.sr = context.sampleRate;

      // Call Zap function
      const value = fn(state);

      // Update state for next call
      state.idx++;

      // Return as mono (audio engine expects array)
      return [value];
    }
  };

  // Register with audio engine
  registry.set(name, signal);

  // Store metadata separately
  zapMetadata.set(name, { name, fn, options, state });

  console.log(`[ZAP] Registered signal: "${name}"`);

  return signal;
}

/**
 * Get a registered signal function
 *
 * @param {string} name - Signal name
 * @returns {Function|undefined} Signal function
 */
export function get(name) {
  const metadata = zapMetadata.get(name);
  return metadata ? metadata.fn : undefined;
}

/**
 * Unregister a signal from both registries
 *
 * @param {string} name - Signal name
 * @param {boolean} clearState - If true, also clear persistent state (default: false)
 * @returns {boolean} Success
 */
export function unregister(name, clearState = false) {
  registry.delete(name);
  zapMetadata.delete(name);

  if (clearState) {
    zapStates.delete(name);
    console.log(`[ZAP] Cleared state for: "${name}"`);
  }

  return true;
}

/**
 * TODO: Gracefully stop a signal with fade-out
 *
 * For REPL live coding, we need a way to stop signals that:
 * 1. Applies exponential fade-out over specified time
 * 2. Automatically unregisters when fade complete
 * 3. Cleans up state from globalThis.ZAP_STATES
 * 4. Frees memory properly
 *
 * Proposed API:
 *   Zap.stop('signal-name', {
 *     fadeOut: 1.0,  // seconds (default: 0.5)
 *     immediate: false,  // skip fade if true
 *     onComplete: () => {}  // callback
 *   });
 *
 * Implementation approach:
 * - Wrap the signal's update function with a fade envelope
 * - Track fade state in the signal's state object
 * - After fade completes, call unregister(name, true)
 *
 * See REPL-WORKFLOW.md for full specification
 */
export function stop(name, options = {}) {
  // TODO: Implement graceful stop with fade-out
  console.warn('[ZAP] stop() not yet implemented, using immediate unregister');
  return unregister(name, true);
}

/**
 * List all registered Zap signals
 *
 * @returns {Array<string>} Signal names
 */
export function list() {
  return Array.from(zapMetadata.keys());
}

/**
 * Clean up stale states (states for signals no longer registered)
 * Call this periodically in long live-coding sessions to prevent memory leaks
 *
 * @returns {number} Number of states cleaned up
 */
export function cleanStaleStates() {
  const activeSignals = new Set(registry.keys());
  let cleaned = 0;

  for (const [name] of zapStates) {
    if (!activeSignals.has(name)) {
      zapStates.delete(name);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[ZAP] Cleaned ${cleaned} stale state(s)`);
  }

  return cleaned;
}

/**
 * Clear all Zap states (nuclear option)
 */
export function clearAllStates() {
  const count = zapStates.size;
  zapStates.clear();
  console.log(`[ZAP] Cleared all ${count} state(s)`);
}

/**
 * The Zap Engine
 *
 * Renders signals at audio rate or custom rate.
 */
export class ZapEngine {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 48000;
    this.state = createState({
      sr: this.sampleRate,
      dt: 1 / this.sampleRate,
      ...options.initialState
    });
  }

  /**
   * Render signal at audio rate
   *
   * @param {Function} fn - Signal function (s => value)
   * @param {number} numSamples - Number of samples to generate
   * @returns {Float32Array} Audio buffer
   */
  render(fn, numSamples) {
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      buffer[i] = fn(this.state);

      // Update state
      this.state.idx++;
      this.state.t += this.state.dt;
    }

    return buffer;
  }

  /**
   * Render signal at custom rate
   *
   * @param {Function} fn - Signal function
   * @param {number} rate - Updates per second
   * @param {number} duration - Duration in seconds
   * @returns {Array} Generated values
   */
  renderAtRate(fn, rate, duration) {
    const dt = 1 / rate;
    const numSteps = Math.floor(duration * rate);
    const values = [];

    // Save audio state
    const savedDt = this.state.dt;
    this.state.dt = dt;

    for (let i = 0; i < numSteps; i++) {
      values.push(fn(this.state));
      this.state.t += dt;
    }

    // Restore audio state
    this.state.dt = savedDt;

    return values;
  }

  /**
   * Render single value (for testing/debugging)
   *
   * @param {Function} fn - Signal function
   * @returns {number} Single value
   */
  sample(fn) {
    return fn(this.state);
  }

  /**
   * Reset state to initial values
   */
  reset(options = {}) {
    this.state = createState({
      sr: this.sampleRate,
      dt: 1 / this.sampleRate,
      ...options
    });
  }

  /**
   * Set position (for spatial synthesis)
   *
   * @param {Object} position - {x, y, z}
   */
  setPosition(position) {
    this.state.position = { ...this.state.position, ...position };
  }

  /**
   * Seek to specific time
   *
   * @param {number} time - Time in seconds
   */
  seek(time) {
    this.state.t = time;
    this.state.idx = Math.floor(time * this.sampleRate);
  }
}

/**
 * Create a Zap engine instance
 *
 * @param {Object} options - Configuration
 * @returns {ZapEngine} Engine instance
 */
export function createEngine(options = {}) {
  return new ZapEngine(options);
}

/**
 * Composition Helpers
 */

/**
 * Mix multiple signals
 *
 * @param {...Function} signals - Signal functions
 * @returns {Function} Mixed signal
 */
export function mix(...signals) {
  return s => {
    let sum = 0;
    for (const signal of signals) {
      sum += signal(s);
    }
    return sum / signals.length;  // Normalize
  };
}

/**
 * Add multiple signals
 *
 * @param {...Function} signals - Signal functions
 * @returns {Function} Summed signal
 */
export function add(...signals) {
  return s => {
    let sum = 0;
    for (const signal of signals) {
      sum += signal(s);
    }
    return sum;
  };
}

/**
 * Multiply signals
 *
 * @param {...Function} signals - Signal functions
 * @returns {Function} Multiplied signal
 */
export function mul(...signals) {
  return s => {
    let product = 1;
    for (const signal of signals) {
      product *= signal(s);
    }
    return product;
  };
}

/**
 * Apply gain to signal
 *
 * @param {Function} signal - Signal function
 * @param {number} gain - Gain amount
 * @returns {Function} Scaled signal
 */
export function gain(signal, amount) {
  return s => signal(s) * amount;
}

/**
 * Map signal through function
 *
 * @param {Function} signal - Signal function
 * @param {Function} mapper - Mapping function
 * @returns {Function} Mapped signal
 */
export function map(signal, mapper) {
  return s => mapper(signal(s), s);
}

/**
 * Compose signals in sequence
 *
 * @param {...Function} fns - Functions to compose
 * @returns {Function} Composed function
 */
export function pipe(...fns) {
  return s => {
    let result = s;
    for (const fn of fns) {
      result = fn(result);
    }
    return result;
  };
}

/**
 * Basic Oscillators
 */

/**
 * Sine oscillator (pure time-based)
 *
 * Simple and composable, but may have phase discontinuities on hot-reload
 * if you change the frequency. For hot-reload safety, manage state manually.
 *
 * @param {number} freq - Frequency in Hz
 * @returns {Function} Sine signal
 */
export function sine(freq) {
  const omega = 2 * Math.PI * freq;
  return s => Math.sin(omega * s.t);
}

/**
 * Cosine oscillator
 *
 * @param {number} freq - Frequency in Hz
 * @returns {Function} Cosine signal
 */
export function cosine(freq) {
  const omega = 2 * Math.PI * freq;
  return s => Math.cos(omega * s.t);
}

/**
 * Sawtooth oscillator
 *
 * @param {number} freq - Frequency in Hz
 * @returns {Function} Sawtooth signal
 */
export function saw(freq) {
  return s => ((freq * s.t) % 1.0) * 2 - 1;
}

/**
 * Square oscillator
 *
 * @param {number} freq - Frequency in Hz
 * @returns {Function} Square signal
 */
export function square(freq) {
  return s => ((freq * s.t) % 1.0) < 0.5 ? 1 : -1;
}

/**
 * Triangle oscillator
 *
 * @param {number} freq - Frequency in Hz
 * @returns {Function} Triangle signal
 */
export function triangle(freq) {
  return s => {
    const phase = (freq * s.t) % 1.0;
    return phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4;
  };
}

/**
 * White noise
 *
 * @returns {Function} Noise signal
 */
export function noise() {
  return s => Math.random() * 2 - 1;
}

/**
 * Envelopes
 */

/**
 * Exponential decay envelope
 *
 * @param {number} decay - Decay rate
 * @returns {Function} Envelope signal
 */
export function decay(decay) {
  return s => Math.exp(-s.t * decay);
}

/**
 * ADSR envelope
 *
 * @param {number} attack - Attack time (seconds)
 * @param {number} decay - Decay time (seconds)
 * @param {number} sustain - Sustain level (0-1)
 * @param {number} release - Release time (seconds)
 * @returns {Function} ADSR envelope
 */
export function adsr(attack, decay, sustain, release) {
  return s => {
    const { t } = s;

    if (t < attack) {
      // Attack
      return t / attack;
    } else if (t < attack + decay) {
      // Decay
      return 1 - (1 - sustain) * (t - attack) / decay;
    } else if (t < attack + decay + sustain) {
      // Sustain
      return sustain;
    } else {
      // Release
      const releaseTime = t - attack - decay - sustain;
      return Math.max(0, sustain * (1 - releaseTime / release));
    }
  };
}

/**
 * Effects
 */

/**
 * Simple delay (no feedback)
 *
 * @param {Function} signal - Input signal
 * @param {number} time - Delay time (seconds)
 * @returns {Function} Delayed signal
 */
export function delay(signal, time) {
  return s => {
    if (!s.delayBuffer) s.delayBuffer = [];

    const delaySamples = Math.floor(time * s.sr);
    const readIdx = s.idx - delaySamples;

    const delayed = readIdx >= 0 ? (s.delayBuffer[readIdx] || 0) : 0;
    s.delayBuffer[s.idx] = signal(s);

    return delayed;
  };
}

/**
 * One-pole lowpass filter
 *
 * @param {Function} signal - Input signal
 * @param {number} cutoff - Cutoff frequency (Hz)
 * @returns {Function} Filtered signal
 */
export function lowpass(signal, cutoff) {
  return s => {
    if (!s.filterState) s.filterState = 0;

    const alpha = cutoff / s.sr;
    const input = signal(s);
    s.filterState = s.filterState + alpha * (input - s.filterState);

    return s.filterState;
  };
}

/**
 * Soft clipping distortion
 *
 * @param {Function} signal - Input signal
 * @param {number} drive - Drive amount
 * @returns {Function} Distorted signal
 */
export function softClip(signal, drive = 1) {
  return s => {
    const input = signal(s) * drive;
    return Math.tanh(input);
  };
}

// Export all as Zap namespace
export const Zap = {
  // Core
  createState,
  createEngine,
  register,
  get,
  unregister,
  stop,  // TODO: Implement graceful stop with fade
  list,
  cleanStaleStates,
  clearAllStates,

  // Composition (built-in)
  mix,
  add,
  mul,
  gain,
  map,
  pipe,

  // Oscillators (pure, composable)
  sine,
  cosine,
  saw,
  square,
  triangle,
  noise,

  // Envelopes
  decay,
  adsr,

  // Effects (built-in)
  delay,
  lowpass,
  softClip,

  // Universal helpers (work on ALL five paradigms)
  ...helpers
};

export default Zap;
