'use strict';

// Y-combinator for strict evaluation
const Y = f => (x => x(x))(x => f((...args) => x(x)(...args)));

// ============================================================================
// MANDELBROT: Y-COMBINATOR VERSION
// ============================================================================

const musicalMandelbrotY = (cx, cy, maxDepth = 50) =>
  Y(recurse => (zx, zy, depth) => {
    if (depth >= maxDepth) return depth;
    if (zx * zx + zy * zy > 4) return depth;

    const zx2 = zx * zx - zy * zy;
    const zy2 = 2 * zx * zy;

    return recurse(zx2 + cx, zy2 + cy, depth + 1);
  })(0, 0, 0);

// ============================================================================
// MANDELBROT: NAMED RECURSION VERSION
// ============================================================================

function musicalMandelbrotNamed(cx, cy, maxDepth = 50) {
  function iterate(zx, zy, depth) {
    if (depth >= maxDepth) return depth;
    if (zx * zx + zy * zy > 4) return depth;

    const zx2 = zx * zx - zy * zy;
    const zy2 = 2 * zx * zy;

    return iterate(zx2 + cx, zy2 + cy, depth + 1);
  }
  return iterate(0, 0, 0);
}

// ============================================================================
// MANDELBROT: ITERATIVE VERSION (for comparison)
// ============================================================================

function musicalMandelbrotIterative(cx, cy, maxDepth = 50) {
  let zx = 0, zy = 0;
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
// BENCHMARK
// ============================================================================

const ITERATIONS = 10000;
const TEST_COORDS = [
  [-0.5, 0],
  [-0.75, 0.1],
  [0.285, 0.01],
  [-0.1011, 0.9563]
];

console.log(`\nBenchmarking ${ITERATIONS} Mandelbrot calculations...\n`);

// Warmup
for (let i = 0; i < 100; i++) {
  musicalMandelbrotY(-0.5, 0, 50);
  musicalMandelbrotNamed(-0.5, 0, 50);
  musicalMandelbrotIterative(-0.5, 0, 50);
}

// Benchmark Y-combinator
const startY = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  for (const [cx, cy] of TEST_COORDS) {
    musicalMandelbrotY(cx, cy, 50);
  }
}
const timeY = performance.now() - startY;

// Benchmark named recursion
const startNamed = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  for (const [cx, cy] of TEST_COORDS) {
    musicalMandelbrotNamed(cx, cy, 50);
  }
}
const timeNamed = performance.now() - startNamed;

// Benchmark iterative
const startIter = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  for (const [cx, cy] of TEST_COORDS) {
    musicalMandelbrotIterative(cx, cy, 50);
  }
}
const timeIter = performance.now() - startIter;

// Results
console.log('Results:');
console.log(`Y-Combinator:    ${timeY.toFixed(2)}ms`);
console.log(`Named Recursion: ${timeNamed.toFixed(2)}ms  (${(timeY / timeNamed).toFixed(2)}x slower than Y)`);
console.log(`Iterative Loop:  ${timeIter.toFixed(2)}ms  (${(timeY / timeIter).toFixed(2)}x slower than Y)`);

console.log('\n--- Analysis ---');
if (timeY / timeNamed < 1.1) {
  console.log('✓ Y-combinator has negligible overhead (<10%)');
} else if (timeY / timeNamed < 1.5) {
  console.log('⚠ Y-combinator has moderate overhead (~10-50%)');
} else {
  console.log('✗ Y-combinator has significant overhead (>50%)');
}

console.log('\nFor audio synthesis at 48,000 samples/second:');
const samplesPerMs = 48;
const ySlowdown = timeY / timeIter;
console.log(`Y-combinator is ${ySlowdown.toFixed(1)}x slower than iteration`);
console.log(`This matters if you're computing Mandelbrot for EVERY sample.`);
console.log(`But for occasional calculations (tempo, note changes), it's fine.`);
