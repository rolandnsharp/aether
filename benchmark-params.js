#!/usr/bin/env bun
// Benchmark: Object parameter vs multiple number parameters

const ITERATIONS = 48000 * 10; // 10 seconds of audio at 48kHz

console.log('='.repeat(60));
console.log('Parameter Passing Benchmark');
console.log(`Testing ${ITERATIONS.toLocaleString()} iterations (10 seconds of audio)`);
console.log('='.repeat(60));

// Test 1: Multiple number parameters (like Rhythmos)
function sineWithNumbers(t, dt, sr) {
  return Math.sin(2 * Math.PI * 440 * t);
}

// Test 2: Single object parameter (like Zap)
function sineWithObject(s) {
  return Math.sin(2 * Math.PI * 440 * s.t);
}

// Test 3: Object with multiple property reads
function complexWithObject(s) {
  const freq = 440;
  const phase = (freq * s.t) % 1.0;
  const amp = 0.5;
  return Math.sin(phase * 2 * Math.PI) * amp * (1 / (s.sr / 1000));
}

// Test 4: Numbers with multiple reads
function complexWithNumbers(t, dt, sr) {
  const freq = 440;
  const phase = (freq * t) % 1.0;
  const amp = 0.5;
  return Math.sin(phase * 2 * Math.PI) * amp * (1 / (sr / 1000));
}

// Warm up JIT
for (let i = 0; i < 10000; i++) {
  sineWithNumbers(i / 48000, 1/48000, 48000);
  sineWithObject({ t: i / 48000, dt: 1/48000, sr: 48000 });
}

console.log('\n--- Test 1: Simple sine (number params) ---');
let sum1 = 0;
const t1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const t = i / 48000;
  sum1 += sineWithNumbers(t, 1/48000, 48000);
}
const time1 = performance.now() - t1;
console.log(`Time: ${time1.toFixed(2)} ms`);
console.log(`Sum (prevent optimization): ${sum1.toFixed(4)}`);

console.log('\n--- Test 2: Simple sine (object param) ---');
let sum2 = 0;
const state = { t: 0, dt: 1/48000, sr: 48000 };
const t2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  state.t = i / 48000;
  sum2 += sineWithObject(state);
}
const time2 = performance.now() - t2;
console.log(`Time: ${time2.toFixed(2)} ms`);
console.log(`Sum (prevent optimization): ${sum2.toFixed(4)}`);

console.log('\n--- Test 3: Complex (number params) ---');
let sum3 = 0;
const t3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const t = i / 48000;
  sum3 += complexWithNumbers(t, 1/48000, 48000);
}
const time3 = performance.now() - t3;
console.log(`Time: ${time3.toFixed(2)} ms`);
console.log(`Sum (prevent optimization): ${sum3.toFixed(4)}`);

console.log('\n--- Test 4: Complex (object param) ---');
let sum4 = 0;
const t4 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  state.t = i / 48000;
  sum4 += complexWithObject(state);
}
const time4 = performance.now() - t4;
console.log(`Time: ${time4.toFixed(2)} ms`);
console.log(`Sum (prevent optimization): ${sum4.toFixed(4)}`);

console.log('\n' + '='.repeat(60));
console.log('RESULTS');
console.log('='.repeat(60));
console.log(`\nSimple sine:`);
console.log(`  Numbers: ${time1.toFixed(2)} ms`);
console.log(`  Object:  ${time2.toFixed(2)} ms`);
console.log(`  Overhead: ${((time2 - time1) / time1 * 100).toFixed(1)}%`);
console.log(`  Per-sample cost: ${((time2 - time1) / ITERATIONS * 1e6).toFixed(3)} nanoseconds`);

console.log(`\nComplex processing:`);
console.log(`  Numbers: ${time3.toFixed(2)} ms`);
console.log(`  Object:  ${time4.toFixed(2)} ms`);
console.log(`  Overhead: ${((time4 - time3) / time3 * 100).toFixed(1)}%`);
console.log(`  Per-sample cost: ${((time4 - time3) / ITERATIONS * 1e6).toFixed(3)} nanoseconds`);

console.log('\n' + '='.repeat(60));
console.log('ANALYSIS');
console.log('='.repeat(60));

const overhead = ((time2 - time1) / time1 * 100);
if (overhead < 5) {
  console.log('\n✅ Overhead is NEGLIGIBLE (<5%)');
  console.log('   Object parameters are fine for audio rate.');
} else if (overhead < 20) {
  console.log('\n⚠️  Overhead is MODERATE (5-20%)');
  console.log('   Acceptable for most cases, but consider numbers for hot paths.');
} else {
  console.log('\n❌ Overhead is SIGNIFICANT (>20%)');
  console.log('   Consider using number parameters for performance-critical code.');
}

console.log('\nNote: Modern JS engines (V8, JSC) optimize monomorphic property');
console.log('access very well. The overhead is mostly from property lookups.');
console.log('In real audio code, Math.sin() dominates the cost anyway.');
