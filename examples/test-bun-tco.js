// Test if Bun actually has tail call optimization

console.log('Testing Bun for Proper Tail Calls...\n');

// Simple tail-recursive sum
function sum(n, acc = 0) {
  if (n === 0) return acc;
  return sum(n - 1, acc + n);  // Tail position
}

// Test with increasing depth
const depths = [100, 1000, 10000, 100000];

for (const depth of depths) {
  try {
    const result = sum(depth);
    console.log(`✓ sum(${depth}) = ${result}`);
  } catch (e) {
    console.log(`✗ sum(${depth}) - Stack overflow at depth ${depth}`);
    break;
  }
}

console.log('\n--- Verdict ---');
console.log('If all tests passed: Bun has TCO');
console.log('If stack overflow occurred: Bun does NOT have TCO');
