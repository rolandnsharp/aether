'use strict';

// Y-combinator for strict evaluation
const Y = f => (x => x(x))(x => f((...args) => x(x)(...args)));

// Simple factorial
const factorial = Y(recurse => (n, acc = 1) => {
  if (n <= 1) return acc;
  return recurse(n - 1, n * acc);
});

// Sum (for testing deep recursion)
const sum = Y(recurse => (n, acc = 0) => {
  if (n === 0) return acc;
  return recurse(n - 1, acc + n);
});

console.log('\n=== Testing Y-Combinator ===');
console.log('Runtime:', typeof Bun !== 'undefined' ? 'Bun' : typeof Deno !== 'undefined' ? 'Deno' : 'Node.js');
console.log('');

// Test basic functionality
console.log('Basic functionality:');
console.log('factorial(10) =', factorial(10));
console.log('✓ Y-combinator works!\n');

// Test deep recursion (TCO required)
console.log('Deep recursion test:');
const depths = [1000, 10000, 100000];

for (const depth of depths) {
  try {
    const result = sum(depth);
    console.log(`✓ sum(${depth}) = ${result}`);
  } catch (e) {
    console.log(`✗ sum(${depth}) - Stack overflow (NO TCO)`);
    console.log('\n--- VERDICT ---');
    console.log('Y-combinator works, but NO tail call optimization.');
    console.log('Deep recursion will fail.');
    process.exit(0);
  }
}

console.log('\n--- VERDICT ---');
console.log('✓ Y-combinator works!');
console.log('✓ Tail call optimization is ENABLED!');
console.log('Deep recursion works perfectly.');
