'use strict';

// Y-combinator that works in strict JavaScript
const Y = f => (x => x(x))(x => f((...args) => x(x)(...args)));

// Test with factorial (tail-recursive)
const factorial = Y(recurse => (n, acc = 1) => {
  if (n <= 1) return acc;
  return recurse(n - 1, n * acc);
});

// Test with fibonacci
const fibonacci = Y(recurse => (n, a = 0, b = 1) => {
  if (n === 0) return a;
  if (n === 1) return b;
  return recurse(n - 1, b, a + b);
});

// Test with sum
const sum = Y(recurse => (n, acc = 0) => {
  if (n === 0) return acc;
  return recurse(n - 1, acc + n);
});

console.log('Testing Y-combinator in strict mode:');
console.log('factorial(10) =', factorial(10));
console.log('factorial(20) =', factorial(20));
console.log('fibonacci(10) =', fibonacci(10));
console.log('fibonacci(50) =', fibonacci(50));
console.log('sum(10000) =', sum(10000));
console.log('\n✓ Y-combinator works with proper eta-expansion!');
