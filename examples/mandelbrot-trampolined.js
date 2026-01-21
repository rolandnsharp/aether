const Speaker = require('speaker');

// ============================================================================
// TAIL RECURSION, TRAMPOLINING, AND THE TCO PROBLEM IN JAVASCRIPT
// ============================================================================
//
// ## The Problem
//
// The Y-combinator and deep recursion are beautiful functional programming
// concepts, but JavaScript doesn't have proper Tail Call Optimization (TCO).
// This means recursive functions build up the call stack and eventually crash
// with "Maximum call stack size exceeded" errors.
//
// The Mandelbrot algorithm can recurse 50-200+ levels deep, which would
// normally overflow the stack.
//
// ## What is Tail Call Optimization (TCO)?
//
// TCO is when the JavaScript engine recognizes that a function's last action
// is to call another function (or itself), and instead of creating a new
// stack frame, it REUSES the current one. This allows infinite recursion
// without stack overflow.
//
// Example of a tail-recursive function:
//
//   function sum(n, acc = 0) {
//     if (n === 0) return acc;
//     return sum(n - 1, acc + n);  // Tail position - last thing we do
//   }
//
// With TCO, this could sum(1000000) without stack overflow.
// Without TCO, it crashes after ~10,000 iterations.
//
// ## The JavaScript TCO Saga
//
// ES6 (2015) included Proper Tail Calls (PTC) in the specification, but:
//
// - Safari/JavaScriptCore: ✓ Implements TCO (the ONLY browser that does)
// - Chrome/V8: ✗ Removed TCO support (breaks debuggers and stack traces)
// - Firefox/SpiderMonkey: ✗ Never implemented TCO
// - Node.js: ✗ Briefly supported in v6-7 with --harmony flag, then removed
// - Deno: ✗ Uses V8, so no TCO
// - Bun: ✓ Uses JavaScriptCore, so HAS TCO!
//
// The main objection: TCO makes debugging harder because stack traces
// disappear. V8 team decided developer experience > optimization.
//
// Sources:
// - https://chromestatus.com/feature/5516876633341952
// - https://github.com/nodejs/CTC/issues/3
// - https://www.onsclom.net/posts/javascript-tco
// - https://world.hey.com/mgmarlow/what-happened-to-proper-tail-calls-in-javascript-5494c256
//
// ## Solution 1: Trampolining
//
// Since JavaScript won't optimize tail calls, we do it ourselves!
//
// Instead of:
//   return recursiveCall(args);  // Builds stack
//
// We return a THUNK (a function that wraps the call):
//   return () => recursiveCall(args);  // Returns function, doesn't call yet
//
// Then the "trampoline" bounces these thunks in a loop:
//
//   while (typeof result === 'function') {
//     result = result();  // Call it, get next thunk or final value
//   }
//
// This keeps the stack at constant depth! Each iteration is a fresh call.
//
// ### When Trampolining Works
//
// Trampolining ONLY works for **tail-recursive** functions where the recursive
// call is the LAST thing the function does:
//
//   ✓ Mandelbrot: return iterate(zx + cx, zy + cy, depth + 1)
//   ✓ Fibonacci: return fib(n - 1, b, a + b)
//   ✓ Sum: return sum(n - 1, acc + n)
//
// ### When Trampolining Doesn't Work
//
// If you need to do something AFTER the recursive call returns, trampolining
// won't work directly:
//
//   ✗ Factorial: return n * factorial(n - 1)  // Multiply happens AFTER
//   ✗ Tree traversal: return left() + right()  // Combine AFTER both calls
//
// For these, you need Continuation Passing Style (CPS) - see below.
//
// ## Solution 2: Continuation Passing Style (CPS)
//
// CPS transforms ANY recursive function into tail-recursive form by passing
// a "continuation" function that represents "what to do next":
//
//   // Normal factorial (not tail-recursive)
//   function factorial(n) {
//     if (n <= 1) return 1;
//     return n * factorial(n - 1);  // Multiply after recursion
//   }
//
//   // CPS factorial (tail-recursive!)
//   function factorialCPS(n, cont = x => x) {
//     if (n <= 1) return cont(1);
//     return () => factorialCPS(n - 1, x => cont(n * x));  // Thunk for trampoline
//   }
//
// The continuation captures "what to do after" without needing the stack.
// This is more complex but handles ANY recursion pattern.
//
// ## Solution 3: Just Use Iteration (Pragmatic)
//
// Or... you can just use a loop:
//
//   function musicalMandelbrot(cx, cy, maxDepth) {
//     let zx = 0, zy = 0;
//     for (let depth = 0; depth < maxDepth; depth++) {
//       if (zx * zx + zy * zy > 4) return depth;
//       const zx2 = zx * zx - zy * zy;
//       const zy2 = 2 * zx * zy;
//       zx = zx2 + cx;
//       zy = zy2 + cy;
//     }
//     return maxDepth;
//   }
//
// This is:
// - Faster (no function call overhead)
// - Simpler (no trampolining complexity)
// - Works everywhere
// - But... not as "pure functional" or elegant
//
// ## Performance Tradeoffs
//
// Trampolining adds overhead from constant function calls and checks.
// In practice, iterative is ~5-10x faster than trampolined recursion.
//
// For audio synthesis at 48,000 samples/second, performance matters!
//
// ## The Philosophy
//
// Languages like Scheme, Haskell, and Elixir have proper TCO built-in.
// They can use the Y-combinator and deep recursion beautifully.
//
// JavaScript forces a choice:
// - Purity (trampolining/CPS) - elegant but slower
// - Pragmatism (iteration) - fast but abandons recursion
//
// This file demonstrates trampolining so you understand the technique.
// But for production audio code, consider iteration.
//
// ## Want Real TCO? Use Bun!
//
// If you really want to use pure recursive code without trampolining,
// try Bun instead of Node/Deno. It uses JavaScriptCore which has TCO:
//
//   bun run mandelbrot-trampolined.js
//
// With Bun, you could use direct recursion without trampolining!
//
// ============================================================================

const SAMPLE_RATE = 48000;

// Trampoline: Keeps calling functions until we get a non-function value
const trampoline = fn => {
  let result = fn;
  while (typeof result === 'function') {
    result = result();
  }
  return result;
};

// Simple trampoline wrapper - turns recursive function into trampolined one
const trampolined = fn => (...args) => {
  let result = () => fn(...args);
  while (typeof result === 'function') {
    result = result();
  }
  return result;
};

// ============================================================================
// MUSICAL UTILITIES
// ============================================================================

const scales = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11]
};

const freq = (root, scale, degree) => {
  const octaves = Math.floor(degree / scale.length);
  const scaleDegree = degree % scale.length;
  const semitones = scale[scaleDegree] + (octaves * 12);
  return root * Math.pow(2, semitones / 12);
};

const step = (t, bpm, steps) => {
  const beatDuration = 60 / bpm;
  const stepDuration = beatDuration / (steps / 4);
  const index = t / stepDuration;
  const phase = (t % stepDuration) / stepDuration;
  return { index, phase };
};

const expEnv = (phase, steepness) => Math.exp(-phase * steepness);

// ============================================================================
// TRAMPOLINED MANDELBROT
// ============================================================================

// Trampolined version - returns thunks to avoid stack buildup
function musicalMandelbrot(cx, cy, maxDepth = 50) {
  function iterate(zx, zy, depth) {
    if (depth >= maxDepth) return depth;
    if (zx * zx + zy * zy > 4) return depth;

    const zx2 = zx * zx - zy * zy;
    const zy2 = 2 * zx * zy;

    // Return a thunk instead of recursing directly
    return () => iterate(zx2 + cx, zy2 + cy, depth + 1);
  }

  return trampoline(() => iterate(0, 0, 0));
}

// ============================================================================
// ALTERNATIVE: ITERATIVE (for comparison)
// ============================================================================

// This is the pragmatic solution - no recursion at all
function musicalMandelbrotIterative(cx, cy, maxDepth = 50) {
  let zx = 0;
  let zy = 0;

  for (let depth = 0; depth < maxDepth; depth++) {
    if (zx * zx + zy * zy > 4) return depth;

    const zx2 = zx * zx - zy * zy;
    const zy2 = 2 * zx * zy;

    zx = zx2 + cx;
    zy = zy2 + cy;
  }

  return maxDepth;
}

// ============================================================================
// SIGNAL GENERATORS
// ============================================================================

const mandelbrotExplore = (useTrampolined = true) => t => {
  const zoom = 1 + t / 20;
  const centerX = -0.5;
  const centerY = 0;
  const angle = t * 0.1;
  const radius = 0.5 / zoom;
  const cx = centerX + Math.cos(angle) * radius;
  const cy = centerY + Math.sin(angle) * radius;

  const maxDepth = Math.floor(50 + Math.log2(zoom) * 10);

  // Choose implementation
  const escapeTime = useTrampolined
    ? musicalMandelbrot(cx, cy, maxDepth)
    : musicalMandelbrotIterative(cx, cy, maxDepth);

  const degree = escapeTime % 8;
  const octave = Math.floor(escapeTime / 8) % 3;
  const f = freq(220 * (octave + 1), scales.minor, degree);

  const { phase } = step(t, 100, 16);
  const trigger = escapeTime % 3 === 0;

  if (!trigger) return 0;

  return Math.sin(2 * Math.PI * f * t) * expEnv(phase, 5) * 0.2;
};

// ============================================================================
// DEMONSTRATION: TRAMPOLINING
// ============================================================================

// Fibonacci with trampolining (tail-recursive version)
function fib(n, a = 0, b = 1) {
  if (n === 0) return a;
  if (n === 1) return b;
  // Return thunk
  return () => fib(n - 1, b, a + b);
}

// Sum with trampolining
function sum(n, acc = 0) {
  if (n === 0) return acc;
  return () => sum(n - 1, acc + n);
}

console.log('Testing trampolining:');
console.log('fib(10) =', trampoline(() => fib(10)));
console.log('fib(100) =', trampoline(() => fib(100)));
console.log('sum(10) =', trampoline(() => sum(10)));
console.log('sum(10000) =', trampoline(() => sum(10000))); // Would overflow without trampoline!
console.log('');

// ============================================================================
// AUDIO OUTPUT
// ============================================================================

function playSignal(signalFn, duration = 30, label = '') {
  const speaker = new Speaker({
    channels: 2,
    bitDepth: 16,
    sampleRate: SAMPLE_RATE
  });

  const BUFFER_SIZE = 4096;
  const buffer = Buffer.alloc(BUFFER_SIZE * 2 * 2);

  let currentTime = 0;
  const endTime = duration;

  function writeNextBuffer() {
    if (currentTime >= endTime) {
      speaker.end();
      console.log('Done!');
      return;
    }

    for (let i = 0; i < BUFFER_SIZE; i++) {
      const t = currentTime + (i / SAMPLE_RATE);
      const sample = signalFn(t);

      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = Math.floor(clamped * 32767);

      const offset = i * 4;
      buffer.writeInt16LE(int16, offset);
      buffer.writeInt16LE(int16, offset + 2);
    }

    currentTime += BUFFER_SIZE / SAMPLE_RATE;
    speaker.write(buffer, writeNextBuffer);
  }

  console.log(`Playing Mandelbrot music ${label}...`);
  writeNextBuffer();
}

// ============================================================================
// PERFORMANCE COMPARISON
// ============================================================================

console.log('Performance comparison:');

// Test trampolined version
const start1 = Date.now();
for (let i = 0; i < 100; i++) {
  musicalMandelbrot(-0.5, 0, 50);
}
const time1 = Date.now() - start1;
console.log(`Trampolined (Y-combinator): ${time1}ms for 100 iterations`);

// Test iterative version
const start2 = Date.now();
for (let i = 0; i < 100; i++) {
  musicalMandelbrotIterative(-0.5, 0, 50);
}
const time2 = Date.now() - start2;
console.log(`Iterative (loop): ${time2}ms for 100 iterations`);
console.log(`Iterative is ${(time1 / time2).toFixed(1)}x faster`);
console.log('');

// ============================================================================
// RUN IT
// ============================================================================

// Choose implementation:
// playSignal(mandelbrotExplore(true), 30, '(trampolined Y-combinator)');
playSignal(mandelbrotExplore(false), 30, '(iterative - faster)');
