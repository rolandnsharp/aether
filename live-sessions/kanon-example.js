const kanon = require('../src/index');
const { pipe, gain, mix } = require('../src/functional');
const { freq, mtof } = require('../src/melody');
const { step } = require('../src/rhythm');
const scales = require('../src/scales');

// ============================================================================
// KANON EXAMPLE SESSION
// ============================================================================
// Sound as a function of time - the Pythagorean approach
//
// Run with: bun src/runner.js sessions/kanon-example.js

// The Golden Ratio
const phi = 1.618033988749;

// Simple sine wave
kanon('sine', t => Math.sin(2 * Math.PI * 440 * t) * 0.3);

// Perfect fifth - the ratio 3:2
kanon('fifth', t => {
  const f = 290;
  const fundamental = Math.sin(2 * Math.PI * f * t);
  const fifth = Math.sin(2 * Math.PI * f * 1.5 * t);
  return (fundamental + fifth) * 0.2;
});

// Pythagorean triad
// kanon('triad', t => {
//   const f = 110;
//   const root = Math.sin(2 * Math.PI * f * t);
//   const third = Math.sin(2 * Math.PI * f * 1.25 * t);  // 5:4
//   const fifth = Math.sin(2 * Math.PI * f * 1.5 * t);   // 3:2

//   return (root + third + fifth) * 0.15;
// });

// // Golden ratio frequency relationship
// kanon('golden', t => {
//   const f = 110;
//   const a = Math.sin(2 * Math.PI * f * t);
//   const b = Math.sin(2 * Math.PI * f * phi * t);

//   return (a + b) * 0.2;
// });

// // Binaural beats (stereo)
// kanon('binaural', t => [
//   Math.sin(2 * Math.PI * 440 * t) * 0.2,  // Left
//   Math.sin(2 * Math.PI * 445 * t) * 0.2   // Right
// ]);

// // Using rhythm helpers
// kanon('rhythm', t => {
//   const s = step(t, 120, 16);  // 120 BPM, 16th notes
//   const freq = 220 * (1 + s.index % 4);
//   const envelope = Math.exp(-10 * s.phase);

//   return Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
// });

// // Using scale helpers
// kanon('melody', t => {
//   const s = step(t, 90, 8);  // 90 BPM, 8th notes
//   const degree = [0, 2, 4, 5, 7, 5, 4, 2][s.index % 8];
//   const f = freq(220, scales.major, degree);
//   const envelope = Math.exp(-5 * s.phase);

//   return Math.sin(2 * Math.PI * f * t) * envelope * 0.25;
// });

// // Using functional helpers
// const sin = f => t => Math.sin(2 * Math.PI * f * t);

// kanon('composed', pipe(
//   sin(330),
//   gain(1.5),
//   t => Math.max(-0.8, Math.min(0.8, t)),  // clip
//   gain(0.3)
// ));

console.log('Kanon session loaded!');
console.log('Active functions:', kanon.list());
console.log('\nEdit this file and save to hear changes instantly.');
