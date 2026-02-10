/**
 * Zap Helpers - Universal signal transformations
 *
 * These helpers work on ALL five paradigms because they operate on
 * the unified (s => value) signature, regardless of what's inside.
 *
 * - Kanon (Fire 🔥): Pure time functions
 * - Rhythmos (Earth 🌍): Stateful evolution
 * - Atomos (Air 💨): Discrete events
 * - Physis (Water 💧): Physics simulations
 * - Chora/Aether (✨): Spatial fields
 */

// ============================================================================
// AMPLITUDE MANIPULATION
// ============================================================================

/**
 * Apply gain to any signal
 * @param {Function} signal - Input signal (s => value)
 * @param {number|Function} amount - Gain amount or function (s => gain)
 * @returns {Function} Scaled signal
 */
export const gain = (signal, amount) => {
  const gainFn = typeof amount === 'function' ? amount : () => amount;
  return s => signal(s) * gainFn(s);
};

/**
 * Hard clip signal to range [-1, 1]
 * @param {Function} signal - Input signal
 * @returns {Function} Clipped signal
 */
export const clip = (signal) => s => {
  const value = signal(s);
  return Math.max(-1, Math.min(1, value));
};

/**
 * Soft clip using tanh
 * @param {Function} signal - Input signal
 * @param {number} drive - Drive amount (default: 1)
 * @returns {Function} Soft-clipped signal
 */
export const softClip = (signal, drive = 1) => s => {
  return Math.tanh(signal(s) * drive);
};

/**
 * Normalize signal to peak amplitude
 * @param {Function} signal - Input signal
 * @param {number} target - Target peak (default: 1.0)
 * @returns {Function} Normalized signal
 */
export const normalize = (signal, target = 1.0) => s => {
  // Track peak over time
  if (!s._normPeak) s._normPeak = 0.001;

  const input = signal(s);
  const absInput = Math.abs(input);

  // Slow peak tracking (attack/release)
  if (absInput > s._normPeak) {
    s._normPeak = absInput; // Fast attack
  } else {
    s._normPeak *= 0.9999; // Slow release
  }

  return input * (target / Math.max(s._normPeak, 0.001));
};

/**
 * Fade in over duration
 * @param {Function} signal - Input signal
 * @param {number} duration - Fade duration in seconds
 * @returns {Function} Faded signal
 */
export const fadeIn = (signal, duration) => s => {
  const envelope = Math.min(1, s.t / duration);
  return signal(s) * envelope;
};

/**
 * Fade out over duration
 * @param {Function} signal - Input signal
 * @param {number} duration - Fade duration in seconds
 * @returns {Function} Faded signal
 */
export const fadeOut = (signal, duration) => s => {
  const envelope = Math.max(0, 1 - s.t / duration);
  return signal(s) * envelope;
};

/**
 * Crossfade between two signals
 * @param {Function} signalA - First signal
 * @param {Function} signalB - Second signal
 * @param {number|Function} mix - Mix amount 0-1 or function (s => mix)
 * @returns {Function} Crossfaded signal
 */
export const crossfade = (signalA, signalB, mix) => {
  const mixFn = typeof mix === 'function' ? mix : () => mix;
  return s => {
    const m = Math.max(0, Math.min(1, mixFn(s)));
    return signalA(s) * (1 - m) + signalB(s) * m;
  };
};

// ============================================================================
// MIXING & COMPOSITION
// ============================================================================

/**
 * Mix multiple signals (average)
 * @param {...Function} signals - Input signals
 * @returns {Function} Mixed signal
 */
export const mix = (...signals) => s => {
  let sum = 0;
  for (const signal of signals) {
    sum += signal(s);
  }
  return sum / signals.length;
};

/**
 * Add multiple signals (sum)
 * @param {...Function} signals - Input signals
 * @returns {Function} Summed signal
 */
export const add = (...signals) => s => {
  let sum = 0;
  for (const signal of signals) {
    sum += signal(s);
  }
  return sum;
};

/**
 * Multiply signals (ring modulation)
 * @param {...Function} signals - Input signals
 * @returns {Function} Multiplied signal
 */
export const mul = (...signals) => s => {
  let product = 1;
  for (const signal of signals) {
    product *= signal(s);
  }
  return product;
};

/**
 * Parallel processing - apply multiple transforms
 * @param {Function} signal - Input signal
 * @param {...Function} transforms - Transform functions
 * @returns {Array<Function>} Array of transformed signals
 */
export const parallel = (signal, ...transforms) => {
  return transforms.map(transform => s => transform(signal)(s));
};

/**
 * Serial processing - pipe through transforms
 * @param {Function} signal - Input signal
 * @param {...Function} transforms - Transform functions
 * @returns {Function} Transformed signal
 */
export const pipe = (signal, ...transforms) => {
  return transforms.reduce((sig, transform) => transform(sig), signal);
};

// ============================================================================
// FILTERING
// ============================================================================

/**
 * One-pole lowpass filter
 * @param {Function} signal - Input signal
 * @param {number|Function} cutoff - Cutoff frequency in Hz or function
 * @returns {Function} Filtered signal
 */
export const lowpass = (signal, cutoff) => {
  const cutoffFn = typeof cutoff === 'function' ? cutoff : () => cutoff;
  const stateKey = Symbol('lowpass_z1');

  return s => {
    if (s[stateKey] === undefined) s[stateKey] = 0;

    const alpha = cutoffFn(s) / s.sr;
    const input = signal(s);
    s[stateKey] = s[stateKey] + alpha * (input - s[stateKey]);

    return s[stateKey];
  };
};

/**
 * One-pole highpass filter
 * @param {Function} signal - Input signal
 * @param {number|Function} cutoff - Cutoff frequency in Hz or function
 * @returns {Function} Filtered signal
 */
export const highpass = (signal, cutoff) => {
  const cutoffFn = typeof cutoff === 'function' ? cutoff : () => cutoff;
  const z1Key = Symbol('highpass_z1');
  const prevKey = Symbol('highpass_prev');

  return s => {
    if (s[z1Key] === undefined) s[z1Key] = 0;
    if (s[prevKey] === undefined) s[prevKey] = 0;

    const alpha = cutoffFn(s) / s.sr;
    const input = signal(s);

    s[z1Key] = alpha * (s[z1Key] + input - s[prevKey]);
    s[prevKey] = input;

    return s[z1Key];
  };
};

/**
 * Biquad filter (general purpose)
 * @param {Function} signal - Input signal
 * @param {string} type - Filter type: 'lowpass', 'highpass', 'bandpass', 'notch', 'peak'
 * @param {number} freq - Center/cutoff frequency in Hz
 * @param {number} Q - Quality factor (resonance)
 * @param {number} gain - Gain in dB (for peak filter)
 * @returns {Function} Filtered signal
 */
export const biquad = (signal, type, freq, Q = 1, gain = 0) => {
  const x1Key = Symbol('bq_x1');
  const x2Key = Symbol('bq_x2');
  const y1Key = Symbol('bq_y1');
  const y2Key = Symbol('bq_y2');

  return s => {
    if (s[x1Key] === undefined) {
      s[x1Key] = 0;
      s[x2Key] = 0;
      s[y1Key] = 0;
      s[y2Key] = 0;
    }

    const omega = 2 * Math.PI * freq / s.sr;
    const cos_omega = Math.cos(omega);
    const sin_omega = Math.sin(omega);
    const alpha = sin_omega / (2 * Q);

    let b0, b1, b2, a0, a1, a2;

    switch (type) {
      case 'lowpass':
        b0 = (1 - cos_omega) / 2;
        b1 = 1 - cos_omega;
        b2 = (1 - cos_omega) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cos_omega;
        a2 = 1 - alpha;
        break;
      case 'highpass':
        b0 = (1 + cos_omega) / 2;
        b1 = -(1 + cos_omega);
        b2 = (1 + cos_omega) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cos_omega;
        a2 = 1 - alpha;
        break;
      case 'bandpass':
        b0 = alpha;
        b1 = 0;
        b2 = -alpha;
        a0 = 1 + alpha;
        a1 = -2 * cos_omega;
        a2 = 1 - alpha;
        break;
      case 'notch':
        b0 = 1;
        b1 = -2 * cos_omega;
        b2 = 1;
        a0 = 1 + alpha;
        a1 = -2 * cos_omega;
        a2 = 1 - alpha;
        break;
      default:
        return signal(s); // Bypass
    }

    const input = signal(s);

    const output = (b0/a0) * input + (b1/a0) * s[x1Key] + (b2/a0) * s[x2Key]
                   - (a1/a0) * s[y1Key] - (a2/a0) * s[y2Key];

    s[x2Key] = s[x1Key];
    s[x1Key] = input;
    s[y2Key] = s[y1Key];
    s[y1Key] = output;

    return output;
  };
};

// ============================================================================
// DELAY & FEEDBACK
// ============================================================================

/**
 * Simple delay (no feedback)
 * @param {Function} signal - Input signal
 * @param {number|Function} time - Delay time in seconds or function
 * @returns {Function} Delayed signal
 */
export const delay = (signal, time) => {
  const timeFn = typeof time === 'function' ? time : () => time;
  const bufferKey = Symbol('delay_buffer');
  const writeKey = Symbol('delay_write');

  return s => {
    if (!s[bufferKey]) {
      const maxDelay = 10; // seconds
      s[bufferKey] = new Float32Array(Math.floor(s.sr * maxDelay));
      s[writeKey] = 0;
    }

    const input = signal(s);
    const delaySamples = Math.floor(timeFn(s) * s.sr);
    const bufferLength = s[bufferKey].length;

    // Write input
    s[bufferKey][s[writeKey]] = input;

    // Read delayed
    const readIdx = (s[writeKey] - delaySamples + bufferLength) % bufferLength;
    const output = s[bufferKey][readIdx];

    // Advance write pointer
    s[writeKey] = (s[writeKey] + 1) % bufferLength;

    return output;
  };
};

/**
 * Feedback delay
 * @param {Function} signal - Input signal
 * @param {number} time - Delay time in seconds
 * @param {number} feedback - Feedback amount (0-1)
 * @returns {Function} Delayed signal with feedback
 */
export const feedbackDelay = (signal, time, feedback) => {
  const bufferKey = Symbol('fbdelay_buffer');
  const writeKey = Symbol('fbdelay_write');

  return s => {
    if (!s[bufferKey]) {
      const maxDelay = 10;
      s[bufferKey] = new Float32Array(Math.floor(s.sr * maxDelay));
      s[writeKey] = 0;
    }

    const input = signal(s);
    const delaySamples = Math.floor(time * s.sr);
    const bufferLength = s[bufferKey].length;

    // Read delayed
    const readIdx = (s[writeKey] - delaySamples + bufferLength) % bufferLength;
    const delayed = s[bufferKey][readIdx];

    // Write input + feedback
    const mixed = input + delayed * feedback;
    s[bufferKey][s[writeKey]] = Math.tanh(mixed); // Soft clip to prevent explosion

    // Advance
    s[writeKey] = (s[writeKey] + 1) % bufferLength;

    return delayed;
  };
};

// ============================================================================
// MODULATION
// ============================================================================

/**
 * Amplitude modulation
 * @param {Function} carrier - Carrier signal
 * @param {Function} modulator - Modulator signal (0-1 range)
 * @param {number} depth - Modulation depth (0-1)
 * @returns {Function} Modulated signal
 */
export const am = (carrier, modulator, depth = 1) => s => {
  const mod = modulator(s);
  return carrier(s) * (1 - depth + mod * depth);
};

/**
 * Frequency modulation
 * @param {Function} carrier - Carrier signal (should use s.fmOffset if present)
 * @param {Function} modulator - Modulator signal
 * @param {number} index - Modulation index
 * @returns {Function} FM signal
 */
export const fm = (carrier, modulator, index) => s => {
  const mod = modulator(s);
  s.fmOffset = mod * index;
  const output = carrier(s);
  delete s.fmOffset;
  return output;
};

/**
 * Tremolo (amplitude LFO)
 * @param {Function} signal - Input signal
 * @param {number} rate - LFO rate in Hz
 * @param {number} depth - Modulation depth (0-1)
 * @returns {Function} Tremolo signal
 */
export const tremolo = (signal, rate, depth = 0.5) => {
  const phaseKey = Symbol('tremolo_phase');

  return s => {
    if (!s[phaseKey]) s[phaseKey] = 0;

    s[phaseKey] = (s[phaseKey] + rate / s.sr) % 1.0;
    const lfo = (Math.sin(s[phaseKey] * 2 * Math.PI) + 1) * 0.5;

    return signal(s) * (1 - depth + lfo * depth);
  };
};

// ============================================================================
// SPATIAL / STEREO
// ============================================================================

/**
 * Pan signal (returns [left, right])
 * @param {Function} signal - Mono input signal
 * @param {number|Function} position - Pan position (-1=left, 0=center, 1=right)
 * @returns {Function} Returns s => [left, right]
 */
export const pan = (signal, position) => {
  const posFn = typeof position === 'function' ? position : () => position;

  return s => {
    const value = signal(s);
    const pos = Math.max(-1, Math.min(1, posFn(s)));

    // Equal power panning
    const angle = (pos + 1) * Math.PI / 4; // 0 to PI/2
    const left = value * Math.cos(angle);
    const right = value * Math.sin(angle);

    return [left, right];
  };
};

/**
 * Stereo width control
 * @param {Function} signalL - Left channel
 * @param {Function} signalR - Right channel
 * @param {number} width - Width amount (0=mono, 1=normal, >1=wider)
 * @returns {Function} Returns s => [left, right]
 */
export const stereoWidth = (signalL, signalR, width) => s => {
  const left = signalL(s);
  const right = signalR(s);

  const mid = (left + right) * 0.5;
  const side = (left - right) * 0.5 * width;

  return [mid + side, mid - side];
};

// ============================================================================
// ANALYSIS & METERING
// ============================================================================

/**
 * Peak meter
 * @param {Function} signal - Input signal
 * @param {number} attackTime - Attack time in seconds
 * @param {number} releaseTime - Release time in seconds
 * @returns {Function} Signal with s.peak property set
 */
export const meter = (signal, attackTime = 0.01, releaseTime = 0.1) => {
  const peakKey = Symbol('meter_peak');

  return s => {
    if (!s[peakKey]) s[peakKey] = 0;

    const input = signal(s);
    const absInput = Math.abs(input);

    const attackCoef = Math.exp(-1 / (attackTime * s.sr));
    const releaseCoef = Math.exp(-1 / (releaseTime * s.sr));

    if (absInput > s[peakKey]) {
      s[peakKey] = s[peakKey] * attackCoef + absInput * (1 - attackCoef);
    } else {
      s[peakKey] = s[peakKey] * releaseCoef + absInput * (1 - releaseCoef);
    }

    s.peak = s[peakKey]; // Expose peak value

    return input;
  };
};

/**
 * RMS meter
 * @param {Function} signal - Input signal
 * @param {number} windowSize - Window size in seconds
 * @returns {Function} Signal with s.rms property set
 */
export const rms = (signal, windowSize = 0.1) => {
  const bufferKey = Symbol('rms_buffer');
  const idxKey = Symbol('rms_idx');

  return s => {
    if (!s[bufferKey]) {
      const size = Math.floor(windowSize * s.sr);
      s[bufferKey] = new Float32Array(size);
      s[idxKey] = 0;
    }

    const input = signal(s);

    // Store squared value
    s[bufferKey][s[idxKey]] = input * input;
    s[idxKey] = (s[idxKey] + 1) % s[bufferKey].length;

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < s[bufferKey].length; i++) {
      sum += s[bufferKey][i];
    }

    s.rms = Math.sqrt(sum / s[bufferKey].length);

    return input;
  };
};

// ============================================================================
// EFFECTS
// ============================================================================

/**
 * Chorus effect
 * @param {Function} signal - Input signal
 * @param {number} rate - LFO rate in Hz
 * @param {number} depth - Depth in seconds
 * @param {number} mix - Wet/dry mix (0-1)
 * @returns {Function} Chorused signal
 */
export const chorus = (signal, rate = 1, depth = 0.01, mix = 0.5) => {
  const phaseKey = Symbol('chorus_phase');
  const bufferKey = Symbol('chorus_buffer');
  const writeKey = Symbol('chorus_write');

  return s => {
    if (!s[phaseKey]) s[phaseKey] = 0;
    if (!s[bufferKey]) {
      s[bufferKey] = new Float32Array(Math.floor(s.sr * 0.1)); // 100ms buffer
      s[writeKey] = 0;
    }

    const input = signal(s);

    // LFO for delay time modulation
    s[phaseKey] = (s[phaseKey] + rate / s.sr) % 1.0;
    const lfo = Math.sin(s[phaseKey] * 2 * Math.PI);
    const delayTime = 0.02 + lfo * depth; // 20ms ± depth

    // Write to buffer
    s[bufferKey][s[writeKey]] = input;

    // Read with modulated delay
    const delaySamples = delayTime * s.sr;
    const readPos = (s[writeKey] - delaySamples + s[bufferKey].length) % s[bufferKey].length;
    const readIdx = Math.floor(readPos);
    const frac = readPos - readIdx;

    // Linear interpolation
    const sample1 = s[bufferKey][readIdx];
    const sample2 = s[bufferKey][(readIdx + 1) % s[bufferKey].length];
    const delayed = sample1 * (1 - frac) + sample2 * frac;

    s[writeKey] = (s[writeKey] + 1) % s[bufferKey].length;

    return input * (1 - mix) + delayed * mix;
  };
};

/**
 * Bitcrusher
 * @param {Function} signal - Input signal
 * @param {number} bits - Bit depth (1-16)
 * @param {number} sampleRateReduction - Sample rate divisor (1 = no reduction)
 * @returns {Function} Crushed signal
 */
export const bitcrush = (signal, bits = 8, sampleRateReduction = 1) => {
  const holdKey = Symbol('crush_hold');
  const countKey = Symbol('crush_count');

  return s => {
    if (!s[holdKey]) s[holdKey] = 0;
    if (!s[countKey]) s[countKey] = 0;

    // Sample rate reduction
    if (s[countKey] >= sampleRateReduction) {
      const input = signal(s);

      // Bit reduction
      const levels = Math.pow(2, bits);
      s[holdKey] = Math.round(input * levels) / levels;

      s[countKey] = 0;
    }

    s[countKey]++;

    return s[holdKey];
  };
};

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Sample & hold
 * @param {Function} signal - Input signal
 * @param {number} rate - Update rate in Hz
 * @returns {Function} Sampled signal
 */
export const sampleHold = (signal, rate) => {
  const holdKey = Symbol('sh_hold');
  const countKey = Symbol('sh_count');

  return s => {
    if (!s[holdKey]) s[holdKey] = 0;
    if (!s[countKey]) s[countKey] = 0;

    const period = Math.floor(s.sr / rate);

    if (s[countKey] >= period) {
      s[holdKey] = signal(s);
      s[countKey] = 0;
    }

    s[countKey]++;

    return s[holdKey];
  };
};

/**
 * Map signal through function
 * @param {Function} signal - Input signal
 * @param {Function} fn - Mapping function (value, s) => newValue
 * @returns {Function} Mapped signal
 */
export const map = (signal, fn) => s => {
  return fn(signal(s), s);
};

/**
 * Quantize to scale/grid
 * @param {Function} signal - Input signal
 * @param {number} step - Quantization step
 * @returns {Function} Quantized signal
 */
export const quantize = (signal, step) => s => {
  const value = signal(s);
  return Math.round(value / step) * step;
};

/**
 * DC blocker (remove DC offset)
 * @param {Function} signal - Input signal
 * @returns {Function} DC-blocked signal
 */
export const dcBlock = (signal) => {
  const x1Key = Symbol('dc_x1');
  const y1Key = Symbol('dc_y1');

  return s => {
    if (!s[x1Key]) {
      s[x1Key] = 0;
      s[y1Key] = 0;
    }

    const input = signal(s);
    const output = input - s[x1Key] + 0.995 * s[y1Key];

    s[x1Key] = input;
    s[y1Key] = output;

    return output;
  };
};
