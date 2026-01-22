'use strict';

// ============================================================================
// WHAT IS A FIXED POINT?
// ============================================================================
//
// A FIXED POINT of a function f is a value x where:
//   f(x) = x
//
// The value doesn't change when you apply the function to it.
//
// Simple examples:
//   - f(x) = x² has fixed points at x=0 and x=1 (because 0²=0 and 1²=1)
//   - f(x) = cos(x) has a fixed point at x≈0.739 (because cos(0.739)≈0.739)
//
// ============================================================================

// Example 1: Fixed point of a number function
function findFixedPoint(f, guess = 0, iterations = 100) {
  let x = guess;
  for (let i = 0; i < iterations; i++) {
    x = f(x);  // Keep applying f until it stabilizes
  }
  return x;
}

console.log('\n=== Fixed Points of Number Functions ===\n');

// Fixed point of cos
const cosFixed = findFixedPoint(x => Math.cos(x), 0);
console.log('Fixed point of cos(x):', cosFixed);
console.log('Verify: cos(' + cosFixed + ') =', Math.cos(cosFixed));
console.log('(They should be equal!)\n');

// ============================================================================
// FIXED POINTS OF HIGHER-ORDER FUNCTIONS
// ============================================================================
//
// The Y combinator finds fixed points of FUNCTION-RETURNING functions!
//
// If F is a function that takes a function and returns a function:
//   F(g) = some function that uses g
//
// Then Y(F) is the FIXED POINT where:
//   Y(F) = F(Y(F))
//
// In other words, the result of Y(F) is a function that equals what you
// get when you pass it back into F.
//
// ============================================================================

const Y = makeRecursive => {
  const wrapper = recursiveFunc => makeRecursive(
    (...args) => recursiveFunc(recursiveFunc)(...args)
  );
  return wrapper(wrapper);
};

// Example 2: Factorial as a fixed point
console.log('=== Factorial as a Fixed Point ===\n');

// This function TAKES a function and RETURNS a function
const factorialTransform = recurse => n =>
  n === 0 ? 1 : n * recurse(n - 1);

// Y finds the fixed point!
const factorial = Y(factorialTransform);

console.log('factorial(5) =', factorial(5));
console.log('\nWhat does "fixed point" mean here?');
console.log('  factorial = factorialTransform(factorial)');
console.log('  The function equals what you get when you pass it to the transform!\n');

// ============================================================================
// FEEDBACK AS A FIXED POINT
// ============================================================================
//
// Now let's understand feedback as a fixed point...
//
// We want a function output(t) where:
//   output(t) = input(t) + output(t - delay) * feedback
//              ^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//              dry signal  delayed version of OUTPUT!
//
// This is CIRCULAR - output depends on ITSELF!
//
// Let's write this as a transformation:

const SAMPLE_RATE = 48000;

const feedbackTransform = (input, delayTime, feedbackAmount) => {
  // This function TAKES a function (recurse) and RETURNS a function (the feedback)
  return recurse => {
    const cache = new Map();

    return t => {
      const key = Math.round(t * SAMPLE_RATE);
      if (cache.has(key)) return cache.get(key);

      if (t < delayTime) {
        const result = input(t);
        cache.set(key, result);
        return result;
      }

      // THE KEY LINE: output = input + recurse(past)
      const result = input(t) + recurse(t - delayTime) * feedbackAmount;
      cache.set(key, result);
      return result;
    };
  };
};

// Now use Y combinator to find the FIXED POINT
function createFeedback(input, delayTime, feedbackAmount) {
  const transform = feedbackTransform(input, delayTime, feedbackAmount);
  return Y(transform);
}

console.log('=== Feedback as a Fixed Point ===\n');

const sineWave = t => Math.sin(2 * Math.PI * 440 * t);
const feedbackSignal = createFeedback(sineWave, 0.05, 0.5);

const t = 0.1;
console.log('Input at t=0.1:', sineWave(t));
console.log('Feedback at t=0.1:', feedbackSignal(t));

console.log('\nWhat does "fixed point" mean for feedback?');
console.log('  Let F = feedbackTransform(input, delay, amount)');
console.log('  Then: feedbackSignal = F(feedbackSignal)');
console.log('');
console.log('  In other words:');
console.log('    feedbackSignal(t) = input(t) + feedbackSignal(t-delay) * amount');
console.log('');
console.log('  The OUTPUT is the function that satisfies this equation!');
console.log('  It\'s self-referential, but Y-combinator FINDS it.');
console.log('');

// ============================================================================
// THE VIDEO FEEDBACK ANALOGY
// ============================================================================

console.log('=== Video Feedback Analogy ===\n');

console.log('Video feedback:');
console.log('  screen(t) = camera(screen(t - delay))');
console.log('  The screen shows itself from the past!');
console.log('  Fixed point: the image that equals itself-from-the-past');
console.log('');

console.log('Audio feedback:');
console.log('  output(t) = input(t) + output(t - delay) × feedback');
console.log('  The output includes itself from the past!');
console.log('  Fixed point: the signal that equals input + itself-from-the-past');
console.log('');

console.log('In both cases:');
console.log('  - Self-reference creates the pattern');
console.log('  - The Y-combinator FINDS the function that satisfies the equation');
console.log('  - Beauty emerges from the mathematical structure\n');

// ============================================================================
// WHY "FIXED POINT" IS BEAUTIFUL
// ============================================================================

console.log('=== Why This Is Beautiful ===\n');

console.log('NORMAL RECURSION (Named):');
console.log('  const output = t => input(t) + output(t - delay);');
console.log('  👆 "output" refers to itself by name (cheating!)');
console.log('');

console.log('Y-COMBINATOR (Fixed Point):');
console.log('  const output = Y(recurse => t => input(t) + recurse(t - delay));');
console.log('  👆 No self-reference! Y DISCOVERS the function that works.');
console.log('');

console.log('The function isn\'t DEFINED recursively,');
console.log('it\'s DISCOVERED as the fixed point of a transformation.');
console.log('');
console.log('Just like Fibonacci spirals aren\'t programmed into video feedback,');
console.log('they EMERGE from the mathematics of self-reflection.');
console.log('');
console.log('Audio feedback with Y-combinator is the same:');
console.log('Beauty emerges from pure mathematical structure.\n');

// ============================================================================
// VISUAL PROOF
// ============================================================================

console.log('=== Visual Proof That It\'s a Fixed Point ===\n');

// Let's verify the fixed point property
const transform = feedbackTransform(sineWave, 0.05, 0.5);
const output1 = Y(transform);
const output2 = transform(output1);  // Apply transform to the result

// They should be the same function!
const testTime = 0.15;
console.log('output1(0.15) =', output1(testTime));
console.log('transform(output1)(0.15) =', output2(testTime));
console.log('');
console.log('They\'re equal! output1 = transform(output1)');
console.log('That\'s what makes it a FIXED POINT.\n');
