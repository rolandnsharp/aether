const signal = require('../src/index');
const { step, env } = signal;

// ============================================================================
// GOLDEN RATIO & FIBONACCI CONSTANTS
// ============================================================================

const PHI = 1.618033988749895;  // Golden ratio (φ)
const PHI_INV = 1 / PHI;        // 0.618... (conjugate)

// Fibonacci sequence generator
const fib = (n) => n <= 1 ? n : fib(n - 1) + fib(n - 2);
const fibSeq = Array.from({ length: 12 }, (_, i) => fib(i + 1));
// [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]

// ============================================================================
// RECURSIVE FRACTAL SYNTHESIS
// ============================================================================

// Recursive frequency relationships based on phi
const phiFractal = (depth, baseFreq, gain, t) => {
  if (depth === 0 || gain < 0.01) return 0;

  const fundamental = Math.sin(2 * Math.PI * baseFreq * t) * gain;
  const upper = phiFractal(depth - 1, baseFreq * PHI, gain * PHI_INV, t);
  const lower = phiFractal(depth - 1, baseFreq * PHI_INV, gain * PHI_INV, t);

  return fundamental + upper + lower;
};

// signal('phi-fractal', t => {
//   return phiFractal(4, 110, 0.3, t);
// });

signal('phi-fractal', t => {
  const { phase } = step(t, 40, 8);  // 40 BPM, eighth notes - adjust BPM lower to slow down
  return phiFractal(4, 110, 0.3, t) * env.exp(phase, 8);  // Gate with envelope
});  

// ============================================================================
// FIBONACCI HARMONIC SERIES
// ============================================================================

// // Use Fibonacci numbers as harmonic multipliers
// const fibHarmonics = fibSeq.slice(0, 8).map((fNum, i) =>
//   signal.sin(110 * fNum / fibSeq[0]).gain(0.1 / (i + 1))
// );

// signal('fib-harmonics', signal.mix(...fibHarmonics).gain(0.25));

// ============================================================================
// GOLDEN RATIO RHYTHM PATTERN
// ============================================================================

// // Euclidean rhythm based on phi proportions
// signal('golden-kick', t => {
//   const { index, phase } = step(t, 120, 21);  // 21 is a Fibonacci number

//   // Pattern: 13 pulses in 21 steps (both Fibonacci numbers)
//   // 13/21 ≈ 0.619 ≈ φ⁻¹
//   const pattern = Array.from({ length: 21 }, (_, i) =>
//     (i * 13) % 21 < 13 ? 1 : 0
//   );

//   if (!pattern[index % 21]) return 0;

//   const pitchEnv = 55 + 89 * env.exp(phase, 15);  // 55 and 89 are Fibonacci
//   return Math.sin(2 * Math.PI * pitchEnv * t) * env.exp(phase, 8) * 0.35;
// });

// ============================================================================
// PHI-SCALED MELODY
// ============================================================================

// Melody where each note is previous note * phi
// signal('phi-melody', t => {
//   const { index, phase } = step(t, 100, 8);

//   // Start at 144 Hz (Fibonacci number), scale by phi powers
//   const baseFreq = 144;
//   const scaleFactor = Math.pow(PHI, (index % 5) - 2);  // Powers: -2, -1, 0, 1, 2
//   const freq = baseFreq * scaleFactor;

//   // Keep in audible range with modulo octave
//   const normalizedFreq = freq % 880 + 110;

//   return Math.sin(2 * Math.PI * normalizedFreq * t) * env.exp(phase, 5) * 0.2;
// });

// ============================================================================
// SELF-SIMILAR FIBONACCI ARPEGGIO
// ============================================================================

// Arpeggio pattern that mirrors Fibonacci sequence
// signal('fib-arp', t => {
//   const { index, phase } = step(t, 144, 16);  // 144 BPM (Fibonacci)

//   // Use Fibonacci numbers as scale degrees (mod 12 for semitones)
//   const degree = fibSeq[index % 8] % 12;
//   const freq = 220 * Math.pow(2, degree / 12);  // 220 Hz base

//   return Math.sin(2 * Math.PI * freq * t) * env.exp(phase, 6) * 0.18;
// });

// ============================================================================
// GOLDEN ANGLE PHASE MODULATION
// // ============================================================================

// // Use golden angle (2π * φ⁻¹) for phase relationships
// const GOLDEN_ANGLE = 2 * Math.PI * PHI_INV;

// signal('golden-phase', t => {
//   const carrier = Math.sin(2 * Math.PI * 233 * t);  // 233 is Fibonacci
//   const modulator = Math.sin(2 * Math.PI * 89 * t + GOLDEN_ANGLE);  // 89 is Fibonacci

//   return carrier * (0.5 + 0.5 * modulator) * 0.25;
// });

// =====/ ============================================================================

// // Use golden angle (2π * φ⁻¹) for phase relationships
// const GOLDEN_ANGLE = 2 * Math.PI * PHI_INV;

// signal('golden-phase', t => {
//   const carrier = Math.sin(2 * Math.PI * 233 * t);  // 233 is Fibonacci
//   const modulator = Math.sin(2 * Math.PI * 89 * t + GOLDEN_ANGLE);  // 89 is Fibonacci

//   return carrier * (0.5 + 0.5 * modulator) * 0.25;
// });=======================================================================
// USAGE NOTES
// ============================================================================

console.log('Golden Fractal Session');
console.log('=====================');
console.log('');
console.log('Signals:');
console.log('- phi-fractal: Recursive fractal based on golden ratio frequency relationships');
console.log('- fib-harmonics: Harmonic series using Fibonacci number ratios');
console.log('- golden-kick: Euclidean rhythm (13 pulses in 21 steps ≈ φ⁻¹)');
console.log('- phi-melody: Melody scaled by powers of φ');
console.log('- fib-arp: Arpeggio using Fibonacci sequence as scale degrees');
console.log('- golden-phase: Phase modulation using the golden angle');
console.log('');
console.log('Try commenting/uncommenting different signals to explore!');
console.log('The mathematical relationships create naturally consonant harmonies.');
