// ============================================================================
// BASIC DSP HELPERS
// ============================================================================
// Core oscillators and effects

const TWO_PI = 2 * Math.PI;

// ============================================================================
// OSCILLATORS
// ============================================================================

/**
 * Sine wave oscillator
 * @param {number} freq - Frequency in Hz
 * @returns {function} Signal function: t => sample
 */
const sin = freq => t => Math.sin(TWO_PI * freq * t);

/**
 * Square wave oscillator
 * @param {number} freq - Frequency in Hz
 * @returns {function} Signal function: t => sample
 */
const square = freq => t => {
  const phase = (freq * t) % 1;
  return phase < 0.5 ? 1 : -1;
};

/**
 * Sawtooth wave oscillator
 * @param {number} freq - Frequency in Hz
 * @returns {function} Signal function: t => sample
 */
const saw = freq => t => {
  const phase = (freq * t) % 1;
  return 2 * phase - 1;
};

/**
 * Triangle wave oscillator
 * @param {number} freq - Frequency in Hz
 * @returns {function} Signal function: t => sample
 */
const tri = freq => t => {
  const phase = (freq * t) % 1;
  return 2 * Math.abs(2 * phase - 1) - 1;
};

/**
 * White noise generator
 * @returns {function} Signal function: t => sample
 */
const noise = () => () => Math.random() * 2 - 1;

// ============================================================================
// AMPLITUDE EFFECTS
// ============================================================================

/**
 * Gain (amplitude multiplication)
 * Works with both mono and stereo signals
 */
const gain = amount => fn => t => {
  const sample = fn(t);
  if (typeof sample === 'number') {
    return sample * amount;
  }
  return [sample[0] * amount, sample[1] * amount];
};

/**
 * DC offset
 * Works with both mono and stereo signals
 */
const offset = amount => fn => t => {
  const sample = fn(t);
  if (typeof sample === 'number') {
    return sample + amount;
  }
  return [sample[0] + amount, sample[1] + amount];
};

/**
 * Hard clipping
 * Works with both mono and stereo signals
 */
const clip = threshold => fn => t => {
  const sample = fn(t);
  if (typeof sample === 'number') {
    return Math.max(-threshold, Math.min(threshold, sample));
  }
  return [
    Math.max(-threshold, Math.min(threshold, sample[0])),
    Math.max(-threshold, Math.min(threshold, sample[1]))
  ];
};

/**
 * Wavefolder
 * Works with both mono and stereo signals
 */
const fold = threshold => fn => t => {
  const foldSample = s => {
    let sample = s;
    while (sample > threshold) sample = 2 * threshold - sample;
    while (sample < -threshold) sample = -2 * threshold - sample;
    return sample;
  };

  const sample = fn(t);
  if (typeof sample === 'number') {
    return foldSample(sample);
  }
  return [foldSample(sample[0]), foldSample(sample[1])];
};

/**
 * Soft clipping (tanh distortion)
 */
const distort = driveFn => fn => t => {
  const sample = fn(t);
  if (typeof sample === 'number') {
    return driveFn(sample);
  }
  return [driveFn(sample[0]), driveFn(sample[1])];
};

// ============================================================================
// MIXING
// ============================================================================

/**
 * Mix multiple signals together
 * Handles both mono and stereo signals
 */
const mix = (...fns) => t => {
  let leftSum = 0;
  let rightSum = 0;
  let isStereo = false;

  for (const fn of fns) {
    const sample = fn(t);
    if (typeof sample === 'number') {
      leftSum += sample;
      rightSum += sample;
    } else {
      leftSum += sample[0];
      rightSum += sample[1];
      isStereo = true;
    }
  }

  return isStereo ? [leftSum, rightSum] : leftSum;
};

// ============================================================================
// STEREO UTILITIES
// ============================================================================

/**
 * Create stereo signal from two mono signals
 */
const stereo = (left, right) => t => [left(t), right(t)];

/**
 * Convert mono to stereo (duplicate to both channels)
 */
const monoToStereo = fn => t => {
  const sample = fn(t);
  return [sample, sample];
};

/**
 * Pan a mono signal (0 = left, 0.5 = center, 1 = right)
 */
const pan = amount => fn => t => {
  const sample = typeof fn(t) === 'number' ? fn(t) : (fn(t)[0] + fn(t)[1]) / 2;
  return [sample * (1 - amount), sample * amount];
};

/**
 * Stereo width control (1 = normal, >1 = wider, <1 = narrower, 0 = mono)
 */
const width = amount => fn => t => {
  const sample = fn(t);
  if (typeof sample === 'number') return sample;

  const [l, r] = sample;
  const mid = (l + r) / 2;
  const side = (l - r) / 2;

  return [mid + side * amount, mid - side * amount];
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Oscillators
  sin,
  square,
  saw,
  tri,
  noise,

  // Amplitude effects
  gain,
  offset,
  clip,
  fold,
  distort,

  // Mixing
  mix,

  // Stereo
  stereo,
  monoToStereo,
  pan,
  width
};
