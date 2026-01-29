// compositions/first-piece.js
// ============================================================================
// A stereo composition to test the N-Dimensional (Stride-2) audio engine.
// ============================================================================

const kanon = require('../src/index');
const { t, sin, mul, add } = kanon; // Symbolic helpers

// --- Stereo Binaural Beat Recipe ---
// This recipe returns an array of two ASTs, one for each channel (Left, Right).
// The JIT compiler will process this into a single stateful player that
// returns a vector `[L, R]` on each tick.
const binauralBeat = t => [
  // Left Channel: A pure sine wave at 440Hz
  sin(mul(t, 440)),
  
  // Right Channel: A pure sine wave at 445Hz
  // The slight detuning will create a psychoacoustic "beating" effect.
  sin(mul(t, 445))
];
kanon('binaural-beat', binauralBeat);

// --- Mono Recipe (for Auto-Upmix Test) ---
// This mono recipe should be automatically duplicated to both channels by the compiler.
const monoTone = t => sin(mul(t, 220));
kanon('mono-tone', monoTone);


console.log("Registered 'binaural-beat' (stereo) and 'mono-tone' (auto-upmixed).");
console.log("You should hear a complex tone with a beating effect, with the mono tone centered.");