// src/arche/kanon/helpers.js - Pure Functional Utilities
// ============================================================================
// Fire 🔥 - Pure functions of time, no state, mathematical beauty
// ============================================================================
// These are truly pure f(t) utilities - no hidden state, just pure math.
// Ported from signal-archive/src/functional.js
// ============================================================================

// ============================================================================
// Y-COMBINATOR (Anonymous Recursion)
// ============================================================================
//
// The Y-combinator enables anonymous recursion - functions that call themselves
// without being named. Essential for pure functional programming.
//
// Classic Y (doesn't work in strict evaluation):
//   Y = λf.(λx.f(x x))(λx.f(x x))
//
// Z-combinator (Y for strict evaluation with eta-expansion):
//   Z = λf.(λx.f(λv.x x v))(λx.f(λv.x x v))

export const Y = makeRecursive => {
  const wrapper = recursiveFunc => makeRecursive(
    (...args) => recursiveFunc(recursiveFunc)(...args)
  );
  return wrapper(wrapper);
};

// ============================================================================
// PIPE / COMPOSE (Function Composition)
// ============================================================================
// NOTE: These compose FUNCTIONS, not values!
// pipe(f, g, h) returns x => h(g(f(x)))

// Left-to-right function composition
export const pipe = (...fns) =>
  fns.reduce((f, g) => x => g(f(x)));

// Right-to-left function composition
export const compose = (...fns) =>
  fns.reduceRight((f, g) => x => g(f(x)));

// ============================================================================
// CURRYING
// ============================================================================

// Auto-curry a function
export const curry = fn => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...more) => curried(...args, ...more);
  };
};

// ============================================================================
// SIGNAL TRANSFORMATIONS (Pure f(t) → f(t))
// ============================================================================

// Multiply signal by constant
export const gain = curry((amt, fn) => t => fn(t) * amt);

// Add constant offset to signal
export const offset = curry((amt, fn) => t => fn(t) + amt);

// Mix multiple signals (sum)
export const mix = (...fns) => t => fns.reduce((sum, fn) => sum + fn(t), 0);

// Hard clip to [-1, 1]
export const clip = fn => t => Math.max(-1, Math.min(1, fn(t)));

// Soft clip with tanh
export const softClip = fn => t => Math.tanh(fn(t));

// ============================================================================
// TIME-BASED COMPOSITION
// ============================================================================

// Play function only during [start, end) interval
// Time is relative to the start of the interval
export const during = curry((start, end, fn) => t => {
  if (t >= start && t < end) {
    return fn(t - start);
  }
  return 0; // Silence outside interval
});

// Sequence of [function, duration] pairs
// Example: sequence([sin440, 1.0], [sin550, 0.5], [sin660, 1.5])
export const sequence = (...pairs) => t => {
  let accumulatedTime = 0;
  for (const [fn, duration] of pairs) {
    if (t >= accumulatedTime && t < accumulatedTime + duration) {
      return fn(t - accumulatedTime);
    }
    accumulatedTime += duration;
  }
  return 0; // Silence after sequence ends
};

// Loop a function count times, each loop having duration
export const loop = curry((count, duration, fn) => t => {
  if (t < 0 || t >= count * duration) return 0;
  const localTime = t % duration;
  return fn(localTime);
});

// Infinite loop (loop forever)
export const loopForever = curry((duration, fn) => t => {
  if (t < 0) return 0;
  return fn(t % duration);
});

// ============================================================================
// DELAY & FEEDBACK (Pure - looking backwards in time)
// ============================================================================

// Simple delay (look backwards in time)
export const delay = curry((delayTime, fn) => t => {
  if (t < delayTime) return 0;
  return fn(t - delayTime);
});

// Feedback using named recursion with memoization
// Note: Uses cache for performance (side effect, but output is still pure)
export const feedback = curry((delayTime, feedbackAmt, fn, sampleRate = 48000) => {
  const cache = new Map();

  const output = t => {
    const key = Math.round(t * sampleRate);
    if (cache.has(key)) return cache.get(key);

    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }

    const dry = fn(t);
    const wet = output(t - delayTime) * feedbackAmt;
    const result = dry + wet;
    cache.set(key, result);
    return result;
  };

  return output;
});

// Feedback using Y-combinator (more elegant, but same behavior)
export const feedbackY = curry((delayTime, feedbackAmt, fn, sampleRate = 48000) => {
  const cache = new Map();

  // Feedback as a fixed point - no named self-reference!
  return Y(recurse => t => {
    const key = Math.round(t * sampleRate);
    if (cache.has(key)) return cache.get(key);

    // Base case: before delay starts
    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }

    // Recursive case: output depends on past output
    const dry = fn(t);
    const wet = recurse(t - delayTime) * feedbackAmt;
    const result = dry + wet;
    cache.set(key, result);
    return result;
  });
});

// ============================================================================
// MODULATION
// ============================================================================

// Amplitude modulation (multiply two signals)
export const am = curry((modulator, carrier) => t =>
  carrier(t) * modulator(t)
);

// Ring modulation (same as AM for pure signals)
export const ringMod = am;

// Frequency modulation (modulate the time parameter)
// Example: fm(0.5, sin(5), sin(440)) creates vibrato
export const fm = curry((depth, modulator, carrier) => t =>
  carrier(t + depth * modulator(t))
);

// ============================================================================
// ENVELOPES (Pure functions of time)
// ============================================================================

// Exponential decay envelope
export const envExp = curry((rate, t) =>
  Math.exp(-t * rate)
);

// Linear envelope (0 to 1 over duration)
export const envLinear = curry((duration, t) =>
  t < 0 ? 0 : t > duration ? 1 : t / duration
);

// Attack-Decay envelope
export const envAD = curry((attack, decay, t) => {
  if (t < 0) return 0;
  if (t < attack) return t / attack;  // Attack phase
  const decayTime = t - attack;
  return Math.exp(-decayTime * decay);  // Decay phase
});

// ============================================================================
// UTILITIES
// ============================================================================

// Constant function (always returns same value)
export const constant = value => t => value;

// Silence
export const silence = constant(0);

// Ramp from a to b over duration
export const ramp = curry((a, b, duration, t) => {
  if (t < 0) return a;
  if (t > duration) return b;
  return a + (b - a) * (t / duration);
});
