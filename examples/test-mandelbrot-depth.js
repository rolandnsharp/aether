'use strict';

// Y-combinator for strict evaluation
const Y = f => (x => x(x))(x => f((...args) => x(x)(...args)));

// Mandelbrot with Y-combinator
const musicalMandelbrot = (cx, cy, maxDepth = 50) =>
  Y(recurse => (zx, zy, depth) => {
    if (depth >= maxDepth) return depth;
    if (zx * zx + zy * zy > 4) return depth;

    const zx2 = zx * zx - zy * zy;
    const zy2 = 2 * zx * zy;

    return recurse(zx2 + cx, zy2 + cy, depth + 1);
  })(0, 0, 0);

console.log('\n=== Testing Mandelbrot with Y-Combinator ===');
console.log('Runtime:', typeof Bun !== 'undefined' ? 'Bun' : typeof Deno !== 'undefined' ? 'Deno' : 'Node.js');
console.log('');

// Test typical audio depths
const testCases = [
  { depth: 50, coords: [-0.5, 0], desc: 'Typical audio depth' },
  { depth: 100, coords: [-0.75, 0.1], desc: 'Medium zoom' },
  { depth: 200, coords: [0.285, 0.01], desc: 'Deep zoom' },
  { depth: 500, coords: [-0.1011, 0.9563], desc: 'Very deep zoom' }
];

for (const { depth, coords, desc } of testCases) {
  try {
    const result = musicalMandelbrot(coords[0], coords[1], depth);
    console.log(`✓ maxDepth=${depth} (${desc}): escape=${result}`);
  } catch (e) {
    console.log(`✗ maxDepth=${depth} (${desc}): Stack overflow!`);
    console.log('\n--- VERDICT ---');
    console.log(`Mandelbrot works up to depth ${testCases[testCases.indexOf({depth, coords, desc}) - 1]?.depth || 'unknown'}`);
    console.log('For deeper recursion, you need Bun with TCO.');
    process.exit(0);
  }
}

console.log('\n--- VERDICT ---');
console.log('✓ Mandelbrot with Y-combinator works at all tested depths!');
console.log('You can use this in your audio synthesis.');
