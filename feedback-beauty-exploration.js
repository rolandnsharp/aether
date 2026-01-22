// ============================================================================
// EXPLORING BEAUTIFUL RECURSION FOR FEEDBACK
// ============================================================================
// Is the current feedback() implementation as beautiful as it could be?
// Let's explore different approaches...

const SAMPLE_RATE = 48000;

// ============================================================================
// OPTION 1: Current Implementation (Pragmatic)
// ============================================================================
// ✓ Efficient with cache
// ✗ Stateful Map()
// ✗ Named recursive function

function currentFeedback(fn, delayTime, feedbackAmount) {
  const cache = new Map();

  const output = t => {
    const key = Math.round(t * SAMPLE_RATE);
    if (cache.has(key)) return cache.get(key);

    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }

    const result = fn(t) + output(t - delayTime) * feedbackAmount;
    cache.set(key, result);
    return result;
  };

  return output;
}

// ============================================================================
// OPTION 2: Y-Combinator Style (Purely Beautiful)
// ============================================================================
// ✓ No explicit self-reference
// ✓ Uses fixed-point combinator
// ✗ Still needs cache for performance
// ✓ More "mathematically elegant"

const Z = f => (x => a => f(x(x))(a))(x => a => f(x(x))(a));

function yCombinatorFeedback(fn, delayTime, feedbackAmount) {
  const cache = new Map();

  // Feedback as a fixed-point
  const feedbackLoop = Z(recurse => t => {
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

  return feedbackLoop;
}

// ============================================================================
// OPTION 3: Pure Corecursion (No Cache)
// ============================================================================
// ✓ Completely pure
// ✓ Beautiful mathematical expression
// ✗ EXTREMELY SLOW - exponential recomputation!
// (Only works for tiny examples)

function pureCorecursion(fn, delayTime, feedbackAmount) {
  const output = t => {
    if (t < delayTime) return fn(t);
    return fn(t) + output(t - delayTime) * feedbackAmount;
  };

  return output;
}

// ============================================================================
// OPTION 4: Functional Memoization (Compromise)
// ============================================================================
// ✓ Cache is a HOF, feels more functional
// ✓ Separates concerns: recursion vs. optimization
// ✗ Still has state, just hidden better

function memoize(f) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = f(...args);
    cache.set(key, result);
    return result;
  };
}

function functionalFeedback(fn, delayTime, feedbackAmount) {
  // Recursive definition WITHOUT memoization
  const pureOutput = t =>
    t < delayTime
      ? fn(t)
      : fn(t) + memoizedOutput(t - delayTime) * feedbackAmount;

  // Add memoization as a separate concern
  const memoizedOutput = memoize(pureOutput);

  return memoizedOutput;
}

// ============================================================================
// OPTION 5: Feedback as a Higher-Order Function
// ============================================================================
// ✓ Most composable
// ✓ Feedback is just a signal transformer
// ✓ Beautiful abstraction

function feedbackHOF(delayTime, feedbackAmount) {
  return inputSignal => {
    const cache = new Map();

    const output = t => {
      const key = Math.round(t * SAMPLE_RATE);
      if (cache.has(key)) return cache.get(key);

      if (t < delayTime) {
        const result = inputSignal(t);
        cache.set(key, result);
        return result;
      }

      const result = inputSignal(t) + output(t - delayTime) * feedbackAmount;
      cache.set(key, result);
      return result;
    };

    return output;
  };
}

// Usage: const delayed = feedbackHOF(0.375, 0.7)(signal.sin(440).fn);

// ============================================================================
// OPTION 6: Explicit Corecursion Pattern
// ============================================================================
// ✓ Makes the corecursion obvious
// ✓ Reads like the mathematical definition
// ✗ Still needs cache

function explicitCorecursion(fn, delayTime, feedbackAmount) {
  const cache = new Map();

  // Define corecursive structure explicitly
  const corec = (self, t) => {
    const key = Math.round(t * SAMPLE_RATE);
    if (cache.has(key)) return cache.get(key);

    // Base case: before delay
    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }

    // Corecursive case: look backward
    const past = self(self, t - delayTime);
    const result = fn(t) + past * feedbackAmount;
    cache.set(key, result);
    return result;
  };

  return t => corec(corec, t);
}

// ============================================================================
// PHILOSOPHICAL QUESTION
// ============================================================================
//
// What is "beautiful"?
//
// 1. **Mathematical purity**: Y-combinator, no state
// 2. **Conceptual clarity**: Obvious recursion, easy to understand
// 3. **Practical elegance**: Works well, performs well, feels good
//
// Like the video feedback creating Fibonacci spirals:
// - The CONCEPT is pure (camera pointing at screen)
// - The IMPLEMENTATION needs a display and camera (state!)
// - The BEAUTY emerges from the pattern
//
// Audio feedback is the same:
// - The CONCEPT is pure (signal feeding back to itself)
// - The IMPLEMENTATION needs memory for efficiency
// - The BEAUTY emerges from the sound
//
// Perhaps the current implementation IS beautiful because it:
// - Expresses the core concept clearly (fn(t) + output(t - delay))
// - Makes the recursion obvious
// - Hides complexity (cache) as an implementation detail
// - Works in practice
//
// Or maybe Y-combinator style is more beautiful because:
// - No explicit self-reference
// - Fixed-point combinator is mathematically profound
// - Aligns with your Y-COMBINATOR-MUSIC.md philosophy
//
// ============================================================================

// Test them:
const testSignal = t => Math.sin(2 * Math.PI * 440 * t);

console.log('\n=== Testing Different Feedback Implementations ===\n');

const t = 0.1;
console.log(`Input at t=${t}:`, testSignal(t));

const fb1 = currentFeedback(testSignal, 0.05, 0.5);
console.log('Current (pragmatic):', fb1(t));

const fb2 = yCombinatorFeedback(testSignal, 0.05, 0.5);
console.log('Y-combinator:', fb2(t));

// Don't test pureCorecursion - it would hang!
// const fb3 = pureCorecursion(testSignal, 0.05, 0.5);
// console.log('Pure corecursion:', fb3(t));  // Would take forever

const fb4 = functionalFeedback(testSignal, 0.05, 0.5);
console.log('Functional memo:', fb4(t));

const fb5 = feedbackHOF(0.05, 0.5)(testSignal);
console.log('Higher-order:', fb5(t));

const fb6 = explicitCorecursion(testSignal, 0.05, 0.5);
console.log('Explicit corec:', fb6(t));

console.log('\n=== Which is most beautiful? ===\n');
console.log('Run: node feedback-beauty-exploration.js');
