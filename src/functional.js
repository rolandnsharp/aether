'use strict';

// ============================================================================
// FUNCTIONAL PROGRAMMING UTILITIES FOR SIGNAL
// ============================================================================
//
// Pure functional tools for recursive and generative synthesis.
// Requires Bun with strict mode for proper tail call optimization.

// ============================================================================
// Y-COMBINATOR
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

const Y = f => (x => x(x))(x => f((...args) => x(x)(...args)));

// ============================================================================
// PIPE / COMPOSE
// ============================================================================

// Left-to-right function composition
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

// Right-to-left function composition
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);

// ============================================================================
// CURRYING
// ============================================================================

// Curry a function (manual)
const curry = fn => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...more) => curried(...args, ...more);
  };
};

// ============================================================================
// SIGNAL UTILITIES
// ============================================================================

// Higher-order signal transformations (curried)
const gain = curry((amt, fn) => t => fn(t) * amt);
const offset = curry((amt, fn) => t => fn(t) + amt);
const mix = (...fns) => t => fns.reduce((sum, fn) => sum + fn(t), 0);

// Delay (pure functional - look backwards in time)
const delay = curry((delayTime, fn) => t => {
  if (t < delayTime) return 0;
  return fn(t - delayTime);
});

// Feedback with memoization (for efficiency)
const feedback = curry((delayTime, feedbackAmt, fn, sampleRate = 48000) => {
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

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  Y,
  pipe,
  compose,
  curry,
  gain,
  offset,
  mix,
  delay,
  feedback
};
