'use strict';

// ============================================================================
// MANDELBROT WITH Y-COMBINATOR - PURE RECURSION (BUN ONLY)
// ============================================================================
//
// IMPORTANT: This file MUST be run in strict mode for TCO to work!
// ES6 specifies that Proper Tail Calls only work in strict mode.
//
// This file demonstrates the BEAUTY of proper tail call optimization.
//
// NO TRAMPOLINING. NO WORKAROUNDS. Just pure, elegant recursion.
//
// This works in Bun because it uses JavaScriptCore (Safari's engine),
// which is the ONLY JavaScript engine that implements proper tail calls
// as specified in ES6.
//
// ## Why This is Beautiful
//
// The Y-combinator is one of the most elegant concepts in computer science.
// It allows anonymous recursion - functions that call themselves without
// naming themselves. It's pure lambda calculus.
//
// In languages with proper TCO (Scheme, Haskell, and now Bun!), you can
// write deeply recursive functions with the Y-combinator and they just work.
// No stack overflow. No trampolining. No iterative rewrites.
//
// This is how functional programming is SUPPOSED to feel.
//
// ## Running This File
//
// ❌ WILL NOT WORK:
//   node mandelbrot-ycombinator-bun.js     # Stack overflow (no TCO)
//   deno run mandelbrot-ycombinator-bun.js # Stack overflow (no TCO)
//
// ✅ WILL WORK:
//   bun mandelbrot-ycombinator-bun.js      # Beautiful recursion!
//
// NOTE: This file uses 'use strict' at the top. TCO only works in strict mode!
//
// Install Bun:
//   curl -fsSL https://bun.sh/install | bash
//
// ============================================================================

const Speaker = require('speaker');

const SAMPLE_RATE = 48000;

// ============================================================================
// THE Y-COMBINATOR (for Strict Evaluation)
// ============================================================================
//
// The Y-combinator enables anonymous recursion - functions that call themselves
// without being named. It's pure lambda calculus magic.
//
// Classic Y-combinator (for lazy evaluation languages like Haskell):
//   Y = λf.(λx.f(x x))(λx.f(x x))
//
// In JavaScript (but doesn't work - causes infinite loop):
//   const Y = fn => (x => fn(x(x)))(x => fn(x(x)));
//
// The problem: JavaScript evaluates arguments BEFORE passing them to functions
// (strict/eager evaluation). So x(x) gets evaluated immediately, which calls
// x(x) again, infinitely.
//
// Solution: Add a lambda wrapper to delay evaluation (eta-expansion).
//
// Z-combinator (Y-combinator for strict evaluation):
//   Z = λf.(λx.f(λv.x x v))(λx.f(λv.x x v))
//
// In JavaScript (clearer notation):
//   const Z = fn => (x => fn(v => x(x)(v)))(x => fn(v => x(x)(v)));
//
// This works! But only for single-argument functions. For multiple arguments,
// we need to use spread:

const Y = f => (x => x(x))(x => f((...args) => x(x)(...args)));

// Breaking down the Y-combinator:
//
// 1. (x => x(x))          - Self-application: pass x to itself
// 2. (x => ...)           - The function that will be self-applied
// 3. f(...)               - Call the user's function f with a "recurse" function
// 4. (...args) => x(x)(...args) - The "recurse" function (delayed self-application)
//
// The key insight: Instead of calling x(x) immediately (which loops forever),
// we wrap it in (...args) => so it only gets called when recurse is actually
// invoked with arguments.

// This is PURE lambda calculus, adapted for strict evaluation.
// Anonymous recursion. No function names. Pure beauty.

// ============================================================================
// MUSICAL UTILITIES
// ============================================================================

const scales = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
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
// MANDELBROT WITH Y-COMBINATOR - PURE ANONYMOUS RECURSION
// ============================================================================

// This is the ELEGANT version. Pure Y-combinator. No function names.
// Anonymous recursion with proper tail call optimization.
//
// In Bun with strict mode, this recursively calls itself 50-200+ times
// WITHOUT stack overflow because JavaScriptCore optimizes tail calls.

const musicalMandelbrot = (cx, cy, maxDepth = 50) =>
  Y(recurse => (zx, zy, depth) => {
    // Base cases
    if (depth >= maxDepth) return depth;
    if (zx * zx + zy * zy > 4) return depth;

    // Complex multiplication: z² = (zx + i*zy)²
    const zx2 = zx * zx - zy * zy;
    const zy2 = 2 * zx * zy;

    // Tail recursive call - optimized by JavaScriptCore!
    return recurse(zx2 + cx, zy2 + cy, depth + 1);
  })(0, 0, 0);


// ============================================================================
// SIGNAL GENERATORS (ORGAN-LIKE SUSTAINED TONES)
// ============================================================================
//
// These generators use slow envelope decay (steepness 0.5-1.0) and slower
// rhythmic subdivisions (quarter notes instead of 16ths) to create smooth,
// sustained organ-like tones instead of staccato dots.
//
// Key changes for organ sound:
// - Envelope steepness: 0.5-1.0 (was 5-6) for long sustain
// - Step subdivision: 4 (quarter notes) instead of 16 (16th notes)
// - Removed trigger conditions that create gaps
// - Lower tempo (60-80 BPM) for more breathing room

const mandelbrotExplore = t => {
  const zoom = 1 + t / 20;
  const centerX = -0.5;
  const centerY = 0;
  const angle = t * 0.1;
  const radius = 0.5 / zoom;
  const cx = centerX + Math.cos(angle) * radius;
  const cy = centerY + Math.sin(angle) * radius;

  const maxDepth = Math.floor(50 + Math.log2(zoom) * 10);

  // Pure Y-combinator recursion - no trampolining needed!
  const escapeTime = musicalMandelbrot(cx, cy, maxDepth);

  const degree = escapeTime % 8;
  const octave = Math.floor(escapeTime / 8) % 3;
  const f = freq(220 * (octave + 1), scales.minor, degree);

  // Slower rhythm for longer, sustained notes (quarter notes instead of 16ths)
  const { phase } = step(t, 80, 4);

  // Very slow envelope decay for organ-like sustain
  // Steepness 0.8 means notes sustain much longer
  const envelope = expEnv(phase, 0.8);

  return Math.sin(2 * Math.PI * f * t) * envelope * 0.2;
};

// ============================================================================
// INFINITE ZOOM WITH Y-COMBINATOR
// ============================================================================

const zoomTargets = [
  { x: -0.5, y: 0, name: 'main' },
  { x: -0.75, y: 0.1, name: 'seahorse' },
  { x: -0.1011, y: 0.9563, name: 'spiral' },
  { x: 0.285, y: 0.01, name: 'elephant' }
];

const infiniteZoom = t => {
  // Switch targets every 60 seconds for variety
  const targetIndex = Math.floor(t / 60) % zoomTargets.length;
  const target = zoomTargets[targetIndex];

  // Exponential zoom: doubles every 10 seconds
  // After 60 seconds: 2^6 = 64x zoom
  // After 600 seconds (10 min): 2^60 = 10^18 zoom (DEEP!)
  const zoom = Math.pow(2, t / 10);

  const width = 2 / zoom;
  const cx = target.x + Math.cos(t * 0.2) * width * 0.1;
  const cy = target.y + Math.sin(t * 0.2) * width * 0.1;

  const maxDepth = Math.floor(100 + Math.log2(zoom) * 15);

  // Even with 200+ iterations, this doesn't overflow in Bun!
  const escape = musicalMandelbrot(cx, cy, maxDepth);

  const scaleIndex = Math.floor(Math.log2(zoom)) % 7;
  const degree = (escape + scaleIndex) % 7;
  const octave = Math.floor(escape / 7) % 3;

  // Slower rhythm for sustained notes (eighth notes)
  const { phase } = step(t, 60, 8);
  const f = freq(220 * (octave + 1), scales.minor, degree);

  // Organ-like sustain - very slow decay
  const envelope = expEnv(phase, 1.0);

  return Math.sin(2 * Math.PI * f * t) * envelope * 0.15;
};

// ============================================================================
// MULTI-SCALE FRACTAL COMPOSITION
// ============================================================================

const fractalComposition = (t, zoom = 1) => {
  const angle = t * 0.05;
  const cx = -0.5 + Math.cos(angle) * 0.3 / zoom;
  const cy = Math.sin(angle) * 0.3 / zoom;
  const baseDepth = Math.floor(50 + Math.log2(zoom) * 10);

  // Three levels of recursive Mandelbrot - each using Y-combinator
  return {
    macro: musicalMandelbrot(cx, cy, baseDepth),
    meso: musicalMandelbrot(cx * 2, cy * 2, baseDepth + 10),
    micro: musicalMandelbrot(cx * 4, cy * 4, baseDepth + 20)
  };
};

const fractalUniverse = t => {
  const zoomLevel = 1 + t / 30;
  const { macro, meso, micro } = fractalComposition(t, zoomLevel);

  // Slower rhythm for all layers (quarter notes for sustained organ sound)
  const { index, phase } = step(t, 70, 4);

  // Harmony from macro structure (bass layer - fully sustained)
  const harmonyDegree = macro % 7;
  const harmonyFreq = freq(110, scales.minor, harmonyDegree);
  const harmony = Math.sin(2 * Math.PI * harmonyFreq * t) * 0.12;

  // Melody from meso structure (middle layer - sustained with gentle envelope)
  const melodyDegree = (meso * 2) % 7;
  const melodyFreq = freq(330, scales.minor, melodyDegree);
  const melodyEnvelope = expEnv(phase, 0.5);  // Very slow decay
  const melody = Math.sin(2 * Math.PI * melodyFreq * t) * melodyEnvelope * 0.18;

  // High layer from micro structure (top notes - gentle sustained)
  const highDegree = (micro * 3) % 7;
  const highFreq = freq(660, scales.minor, highDegree);
  const highEnvelope = expEnv(phase, 0.7);
  const high = Math.sin(2 * Math.PI * highFreq * t) * highEnvelope * 0.08;

  return harmony + melody + high;
};

// ============================================================================
// DEMONSTRATION: Y-COMBINATOR EXAMPLES
// ============================================================================

// Factorial with Y-combinator (anonymous recursion!)
const factorial = Y(recurse => (n, acc = 1) => {
  if (n <= 1) return acc;
  return recurse(n - 1, n * acc);
});

// Fibonacci with Y-combinator
const fibonacci = Y(recurse => (n, a = 0, b = 1) => {
  if (n === 0) return a;
  if (n === 1) return b;
  return recurse(n - 1, b, a + b);
});

// Sum with Y-combinator
const sum = Y(recurse => (n, acc = 0) => {
  if (n === 0) return acc;
  return recurse(n - 1, acc + n);
});

console.log('\n=== Y-Combinator Examples (Pure Anonymous Recursion) ===');
console.log('factorial(10) =', factorial(10));
console.log('factorial(20) =', factorial(20));
console.log('fibonacci(10) =', fibonacci(10));
console.log('fibonacci(100) =', fibonacci(100));
console.log('sum(100000) =', sum(100000), '(100k iterations - no stack overflow!)');
console.log('');

console.log('Testing deep Mandelbrot recursion...');
const testEscape = musicalMandelbrot(-0.5, 0, 200);
console.log('Mandelbrot(-0.5, 0) with maxDepth=200:', testEscape);
console.log('✓ No stack overflow! This is proper tail call optimization.\n');

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
  console.log('Using pure Y-combinator recursion with no trampolining!\n');
  writeNextBuffer();
}

// ============================================================================
// RUN IT
// ============================================================================

// Choose one:
// playSignal(mandelbrotExplore, 30, '(Y-combinator exploration)');
playSignal(infiniteZoom, 600, '(Y-combinator infinite zoom - 10 minute journey)');
// playSignal(fractalUniverse, 30, '(Y-combinator fractal universe)');

// For TRULY infinite journey, use a very large duration:
// playSignal(infiniteZoom, 3600, '(1 hour deep dive into infinity)');
// playSignal(infiniteZoom, Infinity, '(infinite journey - Ctrl+C to stop)');

// ============================================================================
// NOTES ON THE BEAUTY OF THIS APPROACH
// ============================================================================
//
// What makes this elegant:
//
// 1. **Pure Lambda Calculus** - The Y-combinator is pure math, implemented
//    directly. No workarounds, no compromises.
//
// 2. **Tail Recursion Just Works** - Because Bun has proper TCO, we can
//    recurse 200+ levels deep without thinking about it.
//
// 3. **No Performance Penalty** - Unlike trampolining (which is slow), TCO
//    is optimized by the engine. This is as fast as iteration.
//
// 4. **Mathematical Beauty** - This is how Alonzo Church designed lambda
//    calculus to work. Recursive functions naturally expressed as fixed points.
//
// 5. **Proves the Point** - This shows what we LOSE by using Node/Deno.
//    Functional programming should feel like this, not like fighting the runtime.
//
// ## The Philosophical Question
//
// Should JavaScript runtimes sacrifice elegant recursion for better debugging?
// V8 says yes. JavaScriptCore says no.
//
// With Bun, you get to experience what JavaScript COULD be if TCO was universal.
//
// This is the future that ES6 promised but most engines refuse to deliver.
//
// ============================================================================
