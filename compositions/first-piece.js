// compositions/first-piece.js
// ============================================================================
// An FM Vortex composition to test the JIT compiler's additive and
// frequency modulation capabilities with stateful phase continuity.
// ============================================================================

const kanon = require('../src/index');

// Import symbolic helpers directly from kanon for cleaner syntax.
const { t, mul, sin, add } = kanon;

// --- FM Vortex Recipe ---
// This recipe demonstrates phase modulation (FM synthesis).
// Carrier: 220Hz
// Modulator: sin(t * 440 * 2 * PI) * 5 (i.e., a sine wave with amplitude 5,
//                                     modulating the carrier's phase).
// The JIT compiler should recognize two distinct oscillators and allocate
// separate, stable phase slots for them in globalThis.STATE_ARRAY.
const fmVortex = t => sin(add(mul(t, 220), mul(sin(mul(t, 440)), 5)));

// --- Additive Synthesis Recipe ---
// This recipe demonstrates simple additive synthesis.
// Two sine waves are added together.
const additiveSynth = t => add(sin(mul(t, 110)), sin(mul(t, 330)));


// Register both recipes. The JIT compiler will attempt to optimize them.
kanon('fm-vortex', fmVortex);
kanon('additive-synth', additiveSynth);

console.log("Registered 'fm-vortex' (should be JIT-compiled for FM) and 'additive-synth' (should be JIT-compiled for additive).");
console.log("You should hear a rich, complex tone, potentially with modulation.");
console.log("Try editing these recipes while running to test phase-continuous hot-reloading.");
