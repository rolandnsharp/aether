'use strict';

// ============================================================================
// FRACTAL MUSIC WITH Y-COMBINATOR
// ============================================================================
//
// This session demonstrates elegant recursive music using the Y-combinator.
// Requires Bun for proper tail call optimization.
//
// Run with: bun signal sessions/fractal-y-combinator-session.js

const signal = require('../src/index');
const { Y, freq, step, env, scales } = signal;

// ============================================================================
// MANDELBROT SET WITH Y-COMBINATOR
// ============================================================================

// Pure anonymous recursion - no named functions!
const musicalMandelbrot = (cx, cy, maxDepth = 50) =>
  Y(recurse => (zx, zy, depth) => {
    if (depth >= maxDepth) return depth;
    if (zx * zx + zy * zy > 4) return depth;

    const zx2 = zx * zx - zy * zy;
    const zy2 = 2 * zx * zy;

    return recurse(zx2 + cx, zy2 + cy, depth + 1);
  })(0, 0, 0);

// ============================================================================
// BASIC MANDELBROT EXPLORATION
// ============================================================================

signal('mandelbrot', t => {
  // Navigate through parameter space
  const zoom = 1 + t / 20;
  const angle = t * 0.1;
  const radius = 0.5 / zoom;
  const cx = -0.5 + Math.cos(angle) * radius;
  const cy = Math.sin(angle) * radius;

  // Scale maxDepth with zoom
  const maxDepth = Math.floor(50 + Math.log2(zoom) * 10);
  const escape = musicalMandelbrot(cx, cy, maxDepth);

  // Map to music
  const degree = escape % 7;
  const octave = Math.floor(escape / 7) % 3;
  const f = freq(220 * (octave + 1), scales.minor, degree);

  const { phase } = step(t, 100, 16);
  const trigger = escape % 3 === 0;

  if (!trigger) return 0;

  return Math.sin(2 * Math.PI * f * t) * env.exp(phase, 5) * 0.2;
});

// ============================================================================
// RECURSIVE FIBONACCI SEQUENCE (with Y-combinator)
// ============================================================================

const fibonacci = Y(recurse => (n, a = 0, b = 1) => {
  if (n === 0) return a;
  if (n === 1) return b;
  return recurse(n - 1, b, a + b);
});

signal('fibonacci-melody', t => {
  const { index, phase } = step(t, 80, 8);
  const fibIndex = Math.floor(index) % 12;
  const degree = fibonacci(fibIndex) % 7;
  const f = freq(330, scales.major, degree);

  return Math.sin(2 * Math.PI * f * t) * env.exp(phase, 6) * 0.15;
});

// ============================================================================
// RECURSIVE SPECTRAL FRACTAL
// ============================================================================

// Each harmonic generates its own harmonics (recursive)
const spectralFractal = Y(recurse => (fundamental, depth, ratios) => {
  if (depth === 0) return [{ freq: fundamental, amp: 1 }];

  return ratios.flatMap((ratio, i) => {
    const freq = fundamental * ratio;
    const amp = 1 / ratio;
    const subHarmonics = recurse(freq, depth - 1, ratios);

    return [
      { freq, amp },
      ...subHarmonics.map(sub => ({
        freq: sub.freq,
        amp: sub.amp * amp * 0.3
      }))
    ];
  });
});

signal('spectral', t => {
  const partials = spectralFractal(110, 2, [1, 1.5, 2, 2.5, 3]);

  return partials.reduce((sum, partial) => {
    return sum + Math.sin(2 * Math.PI * partial.freq * t) * partial.amp;
  }, 0) * 0.08;
});

console.log('\n✨ Fractal music with Y-combinator');
console.log('Pure anonymous recursion - no stack overflow!\n');
