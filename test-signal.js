// test-signal.js - Test signal generation without audio output
// Run with: bun test-signal.js

import { kanon, updateAll } from './kanon.js';

console.log('Testing sine oscillator signal generation...\n');

// Simple sine at 220Hz
kanon('test-sine', (mem, idx) => {
  const freq = 220.0;

  return {
    update: (sr) => {
      let phase = mem[idx];
      phase = (phase + freq / sr) % 1.0;
      mem[idx] = phase;

      const output = Math.sin(phase * 2 * Math.PI) * 0.3;
      return [output];
    }
  };
});

// Generate and print first 100 samples
console.log('First 100 samples at 44100Hz:');
console.log('Sample | Value');
console.log('-------|--------');

for (let i = 0; i < 100; i++) {
  const sample = updateAll(44100)[0];
  console.log(`${String(i).padStart(6)} | ${sample.toFixed(6)}`);
}

console.log('\n✓ Samples are being generated continuously');
console.log('If you see smooth oscillating values, the DSP math is correct.');
