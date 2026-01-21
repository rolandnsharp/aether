'use strict';

// Test if strict mode enables TCO in Bun

console.log('Testing with strict mode...\n');

function sum(n, acc = 0) {
  if (n === 0) return acc;
  return sum(n - 1, acc + n);
}

try {
  console.log('sum(100000) =', sum(100000));
  console.log('✓ No stack overflow - TCO is working!');
} catch (e) {
  console.log('✗ Stack overflow - TCO is NOT working even in strict mode');
  console.log(e.message);
}
