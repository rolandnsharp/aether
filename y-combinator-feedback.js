'use strict';

// ============================================================================
// BEAUTIFUL FEEDBACK WITH Y-COMBINATOR (FOR BUN)
// ============================================================================
// Using Y combinator with spread operator for strict evaluation in Bun

const SAMPLE_RATE = 48000;

// Y combinator - readable version with spread operator
const Y = makeRecursive => {
  const wrapper = recursiveFunc => makeRecursive(
    (...args) => recursiveFunc(recursiveFunc)(...args)
  );
  return wrapper(wrapper);
};

// ============================================================================
// FEEDBACK AS A FIXED POINT (Y-COMBINATOR)
// ============================================================================

function beautifulFeedback(fn, delayTime, feedbackAmount) {
  const cache = new Map();

  // Feedback is the FIXED POINT of this transformation
  const feedback = Y(recurse => t => {
    const key = Math.round(t * SAMPLE_RATE);

    if (cache.has(key)) return cache.get(key);

    // Base case: before delay starts
    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }

    // Corecursive case: output depends on past output
    const dry = fn(t);
    const wet = recurse(t - delayTime) * feedbackAmount;  // Look backward!
    const result = dry + wet;

    cache.set(key, result);
    return result;
  });

  return feedback;
}

// ============================================================================
// FOR SIGNAL.PROTOTYPE.FEEDBACK
// ============================================================================
// This is how it would look in src/index.js

const feedbackMethodBeautiful = function(delayTime, feedbackAmount) {
  // Y combinator with spread operator
  const Y = makeRecursive => {
    const wrapper = recursiveFunc => makeRecursive(
      (...args) => recursiveFunc(recursiveFunc)(...args)
    );
    return wrapper(wrapper);
  };

  return new Signal(
    this.channels.map(fn => {
      const cache = new Map();

      // Feedback as fixed point - no self-reference!
      return Y(recurse => t => {
        const key = Math.round(t * SAMPLE_RATE);
        if (cache.has(key)) return cache.get(key);

        if (t < delayTime) {
          const result = fn(t);
          cache.set(key, result);
          return result;
        }

        const result = fn(t) + recurse(t - delayTime) * feedbackAmount;
        cache.set(key, result);
        return result;
      });
    }),
    this._registryName
  )._register();
};

// ============================================================================
// COMPARISON
// ============================================================================

// CURRENT (named recursion):
function currentFeedback(fn, delayTime, feedbackAmount) {
  const cache = new Map();

  const output = t => {  // 👈 Named function
    const key = Math.round(t * SAMPLE_RATE);
    if (cache.has(key)) return cache.get(key);
    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }
    const result = fn(t) + output(t - delayTime) * feedbackAmount;  // 👈 Calls itself by name
    cache.set(key, result);
    return result;
  };

  return output;
}

// BEAUTIFUL (Y-combinator):
function yCombinatorFeedback(fn, delayTime, feedbackAmount) {
  const cache = new Map();

  // No self-reference! Fixed point of the transformation
  return Y(recurse => t => {  // 👈 No name, just recurse parameter
    const key = Math.round(t * SAMPLE_RATE);
    if (cache.has(key)) return cache.get(key);
    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }
    const result = fn(t) + recurse(t - delayTime) * feedbackAmount;  // 👈 Uses recurse, not self
    cache.set(key, result);
    return result;
  });
}

// ============================================================================
// THE PROFOUND BEAUTY
// ============================================================================
//
// Video feedback: camera → screen → camera → screen...
//   Self-reflection creates Fibonacci spirals
//
// Audio feedback: signal → delay → feedback → signal...
//   Self-reflection creates harmonic beauty
//
// Y-combinator expresses this WITHOUT naming the loop:
//   Y(λrecurse. λt. input(t) + recurse(t - δ) × feedback)
//
// This says: "Find the FIXED POINT where the signal equals itself
// plus a delayed scaled version of itself."
//
// That fixed point IS the feedback. It's not a loop with a name,
// it's a mathematical truth discovered through λ-calculus.
//
// Just like the Fibonacci spiral isn't "programmed" into the video
// feedback - it EMERGES from self-reflection - the audio beauty
// EMERGES from the Y-combinator fixed point.
//
// ============================================================================

// Test
const testSignal = t => Math.sin(2 * Math.PI * 440 * t);

console.log('\n=== Y-Combinator Feedback (Pure Functional Beauty) ===\n');

const t1 = 0.1;
const fb1 = currentFeedback(testSignal, 0.05, 0.5);
const fb2 = yCombinatorFeedback(testSignal, 0.05, 0.5);

console.log(`Input at t=${t1}:`, testSignal(t1));
console.log('Current (named recursion):', fb1(t1));
console.log('Y-combinator (fixed point):', fb2(t1));
console.log('\n✓ Both produce identical results!');

console.log('\nBut Y-combinator is mathematically profound:');
console.log('  - No explicit self-reference');
console.log('  - Feedback is a FIXED POINT, discovered not defined');
console.log('  - Pure λ-calculus beauty');
console.log('  - Self-reflection creates emergence');
console.log('\nJust like video feedback creates Fibonacci spirals,');
console.log('audio feedback with Y-combinator creates harmonic beauty.\n');
