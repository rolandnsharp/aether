'use strict';

// ============================================================================
// INFINITE TAPESTRY: A Continuous Meditation on Mathematical Beauty
// ============================================================================
// Run with: bun signal sessions/infinite-tapestry.js
//
// No movements, no sections - just one continuous 30-minute flow where:
// - Pythagoras meets Tesla
// - Chaos dances with order
// - The One emanates through electricity
// - Golden ratios spiral through feedback loops
// - Ancient philosophy manifests as waveforms
//
// Themes weave in and out organically, appearing, transforming, combining,
// fading, and returning in an endless dance of mathematical beauty.
//
// This is our journey made audible - all discoveries flowing as one.
// ============================================================================

const signal = require('../src/index');
const { step, freq, scales, env } = signal;

// Y-Combinator: The One contemplating itself
const Y = makeRecursive => {
  const wrapper = recursiveFunc => makeRecursive(
    (...args) => recursiveFunc(recursiveFunc)(...args)
  );
  return wrapper(wrapper);
};

// Golden ratio - the divine proportion
const φ = 1.618033988749;

// Prime numbers - fundamental building blocks
const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];

// ============================================================================
// LAYER 1: THE FUNDAMENTAL - Pythagoras's Discovery
// A deep drone that slowly reveals its harmonic nature
// ============================================================================

signal('pythagorean-foundation', t => {
  const fundamental = 55;  // A1 - The One

  // Number of harmonics grows and shrinks over time (breathing)
  const breath_cycle = 120;  // 2-minute breath
  const breath = Math.sin(2 * Math.PI * t / breath_cycle);
  const numHarmonics = Math.floor(8 + 8 * breath);

  let sum = 0;
  for (let n = 1; n <= numHarmonics; n++) {
    const harmonic_freq = fundamental * n;
    const amplitude = 1.0 / Math.sqrt(n);

    // Each harmonic has subtle phase modulation (living, organic)
    const phase_mod = 0.01 * Math.sin(2 * Math.PI * t / (10 + n));

    sum += Math.sin(2 * Math.PI * harmonic_freq * t + phase_mod) * amplitude;
  }

  // Global amplitude envelope (slow fade in/out)
  const global_env = 0.3 + 0.2 * Math.sin(2 * Math.PI * t / 180);

  return sum * global_env * 0.08 / Math.sqrt(numHarmonics);
});

// ============================================================================
// LAYER 2: GOLDEN SPIRAL - φ Relationships
// Frequencies at golden ratio multiples, creating consonance and mystery
// ============================================================================

signal('golden-spiral', t => {
  const base = 110;  // A2

  // Five voices at φ powers
  const voices = [
    { freq: base, phase_offset: 0 },
    { freq: base * φ, phase_offset: 0.2 },
    { freq: base * φ * φ, phase_offset: 0.4 },
    { freq: base * φ * φ * φ, phase_offset: 0.6 },
    { freq: base * φ * φ * φ * φ, phase_offset: 0.8 }
  ];

  let sum = 0;
  voices.forEach((voice, i) => {
    // Each voice fades in and out at different rates
    const fade_rate = 1 / (30 + i * 10);
    const presence = 0.5 + 0.5 * Math.sin(2 * Math.PI * t * fade_rate + voice.phase_offset);

    const amplitude = (1.0 / (i + 1)) * presence;
    sum += Math.sin(2 * Math.PI * voice.freq * t) * amplitude;
  });

  return sum * 0.12;
});

// ============================================================================
// LAYER 3: CHAOS MELODY - Logistic Map
// Organic, unpredictable melodic content from deterministic chaos
// ============================================================================

const logisticMap = Y(recurse => (x, r, n) => {
  if (n === 0) return [];
  const next = r * x * (1 - x);
  return [next, ...recurse(next, r, n - 1)];
});

const chaosSequence = logisticMap(0.1, 3.9, 500);

signal('chaos-voice', t => {
  // Only present sometimes (fades in and out)
  const presence = Math.pow(Math.sin(2 * Math.PI * t / 200), 2);
  if (presence < 0.1) return 0;

  const { index, phase } = step(t, 70 + 20 * Math.sin(2 * Math.PI * t / 100), 16);
  const chaosValue = chaosSequence[index % chaosSequence.length];

  const degree = Math.floor(chaosValue * 8);
  const f = freq(220, scales.minor, degree);

  const amplitude = (0.08 + chaosValue * 0.07) * presence;

  return Math.sin(2 * Math.PI * f * t) * env.exp(phase, 6 + chaosValue * 4) * amplitude;
});

// ============================================================================
// LAYER 4: CONJUGATE FIELDS - Steinmetz's E and H
// Stereo field with 90° phase relationships creating spatial energy flow
// ============================================================================

signal('electromagnetic-stereo', {
  left: t => {
    // Electric field component
    const carrier = 165 + 55 * Math.sin(2 * Math.PI * t / 90);  // Drifting frequency
    const E = Math.cos(2 * Math.PI * carrier * t);

    // Slow amplitude modulation
    const presence = 0.3 + 0.2 * Math.sin(2 * Math.PI * t / 67);

    // Add harmonics
    const harmonic2 = Math.cos(2 * Math.PI * carrier * 2 * t) * 0.3;

    return (E + harmonic2) * presence * 0.1;
  },

  right: t => {
    // Magnetic field component (90° phase shifted)
    const carrier = 165 + 55 * Math.sin(2 * Math.PI * t / 90);
    const H = Math.sin(2 * Math.PI * carrier * t);

    const presence = 0.3 + 0.2 * Math.sin(2 * Math.PI * t / 73);

    const harmonic2 = Math.sin(2 * Math.PI * carrier * 2 * t) * 0.3;

    return (H + harmonic2) * presence * 0.1;
  }
});

// ============================================================================
// LAYER 5: RING MODULATION - Poynting Vector
// Energy flow from E × H interaction, creating sidebands
// ============================================================================

signal('energy-flow', t => {
  // Only present in middle third of the piece
  const time_window = Math.sin(2 * Math.PI * t / 1800);  // 30-min cycle
  const presence = Math.pow(Math.max(0, time_window), 2);

  if (presence < 0.05) return 0;

  // Two fields interacting
  const carrier = 220 + 110 * Math.sin(2 * Math.PI * t / 120);
  const modulator = 0.5 + 0.3 * Math.sin(2 * Math.PI * t / 50);

  const E = Math.sin(2 * Math.PI * carrier * t);
  const H = Math.sin(2 * Math.PI * modulator * t);

  // Poynting vector: S = E × H
  return E * H * presence * 0.15;
});

// ============================================================================
// LAYER 6: PRIME HARMONICS - Otherworldly Timbre
// Only prime number harmonics, creating alien resonance
// ============================================================================

signal('prime-resonance', t => {
  const fundamental = 82.4;  // E2

  // Fades in after 5 minutes, fades out before end
  const fade_in = Math.min(1, Math.max(0, (t - 300) / 60));
  const fade_out = Math.min(1, Math.max(0, (1800 - t) / 60));
  const presence = fade_in * fade_out;

  if (presence < 0.05) return 0;

  let sum = 0;
  primes.slice(0, 7).forEach(n => {
    const harmonic_freq = fundamental * n;
    const amplitude = 1.0 / Math.sqrt(n);

    // Each prime modulates independently
    const mod = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / (n * 3));

    sum += Math.sin(2 * Math.PI * harmonic_freq * t) * amplitude * mod;
  });

  return sum * presence * 0.08;
});

// ============================================================================
// LAYER 7: FEEDBACK ECHOES - Self-Reflection Creating Beauty
// Sparse impulses that feedback reveals as infinite patterns
// ============================================================================

signal('feedback-voice', t => {
  const { index, phase } = step(t, 50 + 30 * Math.sin(2 * Math.PI * t / 150), 4);

  // Sparse triggers
  const trigger_pattern = [1, 0, 0, 1, 0, 1, 0, 0];
  const should_trigger = trigger_pattern[index % trigger_pattern.length];

  if (!should_trigger || phase > 0.03) return 0;

  // Different fundamentals over time
  const fundamentals = [165, 220, 275, 330];
  const fundamental = fundamentals[Math.floor(t / 300) % fundamentals.length];

  const impulse = Math.sin(2 * Math.PI * fundamental * t) *
                  env.exp(phase * 30, 20) * 0.25;

  return impulse;
}).feedback(0.375, 0.75);

// ============================================================================
// LAYER 8: L-SYSTEM GROWTH - Algorithmic Evolution
// Patterns that grow according to grammatical rules
// ============================================================================

const lSystem = Y(recurse => (rules, axiom, depth) => {
  if (depth === 0) return axiom;
  const expanded = axiom.split('').map(s => rules[s] || s).join('');
  return recurse(rules, expanded, depth - 1);
});

const algae = lSystem({ A: 'AB', B: 'A' }, 'A', 9);

signal('algorithmic-growth', t => {
  // Present in waves
  const wave = Math.sin(2 * Math.PI * t / 240);
  const presence = Math.pow(Math.max(0, wave), 2);

  if (presence < 0.1) return 0;

  const { index, phase } = step(t, 85, 16);
  const symbol = algae[index % algae.length];

  const notes = { A: 0, B: 4 };  // Root and third
  const degree = notes[symbol] || 0;
  const f = freq(330, scales.major, degree);

  return Math.sin(2 * Math.PI * f * t) * env.exp(phase, 7) * presence * 0.1;
});

// ============================================================================
// LAYER 9: DOPPLER SHIMMER - Moving Sources
// High frequencies that drift in pitch as if sources are moving
// ============================================================================

signal('doppler-drift', t => {
  const speed_of_sound = 343;
  const base_freq = 880;  // A5

  // Three sources moving in different patterns
  const sources = [
    { speed: 3 * Math.sin(2 * Math.PI * t / 40), offset: 0 },
    { speed: 5 * Math.sin(2 * Math.PI * t / 53), offset: Math.PI / 3 },
    { speed: 7 * Math.sin(2 * Math.PI * t / 67), offset: 2 * Math.PI / 3 }
  ];

  let sum = 0;
  sources.forEach(src => {
    const doppler_freq = base_freq * speed_of_sound / (speed_of_sound - src.speed);
    sum += Math.sin(2 * Math.PI * doppler_freq * t) * 0.03;
  });

  // Very subtle, high shimmer
  const presence = 0.3 + 0.2 * Math.sin(2 * Math.PI * t / 111);
  return sum * presence;
});

// ============================================================================
// LAYER 10: INTERFERENCE BEATS - Standing Waves
// Slightly detuned sources creating slow beats
// ============================================================================

signal('interference-pattern', t => {
  // Two sources slightly detuned
  const freq1 = 440;
  const freq2 = 441.5;  // 1.5 Hz beats

  const wave1 = Math.sin(2 * Math.PI * freq1 * t);
  const wave2 = Math.sin(2 * Math.PI * freq2 * t);

  // Interference creates slow amplitude modulation
  const interference = wave1 + wave2;

  // Fades in and out
  const presence = 0.4 + 0.3 * Math.sin(2 * Math.PI * t / 143);

  return interference * presence * 0.08;
});

// ============================================================================
// LAYER 11: MANDELBROT TEXTURE - Parameter Space Navigation
// Very subtle background texture from fractal exploration
// ============================================================================

const mandelbrot = Y(recurse => (cx, cy, zx, zy, depth, maxDepth) => {
  if (depth >= maxDepth) return depth;
  if (zx * zx + zy * zy > 4) return depth;
  return recurse(cx, cy, zx * zx - zy * zy + cx, 2 * zx * zy + cy, depth + 1, maxDepth);
});

signal('fractal-whisper', t => {
  // Slowly navigate parameter space
  const zoom = 1 + t / 120;
  const angle = t * 0.03;
  const radius = 0.5 / zoom;

  const cx = -0.5 + Math.cos(angle) * radius;
  const cy = 0 + Math.sin(angle) * radius;

  const maxDepth = Math.floor(25 + Math.log2(zoom) * 3);
  const escapeTime = mandelbrot(cx, cy, 0, 0, 0, maxDepth);

  // Map to very subtle tones
  const { phase } = step(t, 40, 32);

  const trigger = escapeTime % 7 === 0;
  if (!trigger) return 0;

  const degree = escapeTime % 8;
  const f = freq(110, scales.minor, degree);

  return Math.sin(2 * Math.PI * f * t) * env.exp(phase, 15) * 0.06;
});

// ============================================================================
// LAYER 12: TESLA RESONANCE - Longitudinal Modes
// Quarter-wave resonator (odd harmonics) like Tesla coil
// ============================================================================

signal('tesla-modes', t => {
  // Present in waves
  const presence = Math.pow(Math.sin(2 * Math.PI * t / 300), 2);

  if (presence < 0.1) return 0;

  const fundamental = 110;
  const modes = [1, 3, 5, 7, 9];  // Quarter-wave (odd only)

  let sum = 0;
  modes.forEach(n => {
    const harmonic_freq = fundamental * n;
    const amplitude = 1.0 / Math.sqrt(n);

    // Each mode has independent modulation
    const mod = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / (n * 5));

    sum += Math.sin(2 * Math.PI * harmonic_freq * t) * amplitude * mod;
  });

  return sum * presence * 0.1;
});

// ============================================================================
// LAYER 13: AETHER DENSITY - Medium Modulation
// FM-like effects from varying propagation medium
// ============================================================================

signal('medium-waves', t => {
  // Fades in middle section
  const window = Math.sin(2 * Math.PI * (t - 600) / 600);
  const presence = Math.pow(Math.max(0, window), 2);

  if (presence < 0.05) return 0;

  const carrier = 220;
  const density_freq = 0.3;

  // "Density" oscillation
  const density = 1 + 0.4 * Math.sin(2 * Math.PI * density_freq * t);

  // Phase modulation from density
  const modulated = Math.sin(2 * Math.PI * carrier * t / density);

  return modulated * presence * 0.12;
});

// ============================================================================
// LAYER 14: REACTIVE SHIMMER - Imaginary Power
// 90° phase relationships creating 2× frequency shimmer
// ============================================================================

signal('imaginary-energy', t => {
  const freq_base = 1320;  // High shimmer

  // Inductive (leading)
  const inductive = Math.sin(2 * Math.PI * freq_base * t);

  // Capacitive (lagging)
  const capacitive = Math.sin(2 * Math.PI * freq_base * t - Math.PI / 2);

  // Reactive power = product (creates 2× frequency)
  const reactive = inductive * capacitive;

  // Very subtle, always present
  return reactive * 0.02;
});

// ============================================================================
// LAYER 15: BREATH OF THE ONE - Global Pulse
// Slowest rhythm, organizing all time
// ============================================================================

signal('cosmic-breath', t => {
  const { phase } = step(t, 12, 1);  // 12 BPM - slow breath

  if (phase > 0.05) return 0;

  // Very deep fundamental
  const fundamental = 27.5;  // A0

  const pulse = Math.sin(2 * Math.PI * fundamental * t) *
                env.exp(phase * 20, 12);

  return pulse * 0.06;
});

// ============================================================================
// TAPESTRY COMPLETE
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                   INFINITE TAPESTRY                        ║');
console.log('║        All Discoveries Woven Into One Continuous Flow      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('🎨 Now Playing: Continuous generative meditation...\n');

console.log('🧵 Fifteen threads woven as one:');
console.log('   1.  Pythagorean Foundation - Harmonics breathing');
console.log('   2.  Golden Spiral - φ relationships');
console.log('   3.  Chaos Voice - Logistic map melodies');
console.log('   4.  Electromagnetic Fields - E and H at 90°');
console.log('   5.  Energy Flow - Ring modulation');
console.log('   6.  Prime Resonance - Alien harmonics');
console.log('   7.  Feedback Echoes - Self-reflection');
console.log('   8.  Algorithmic Growth - L-systems');
console.log('   9.  Doppler Shimmer - Moving sources');
console.log('   10. Interference Beats - Standing waves');
console.log('   11. Fractal Whisper - Mandelbrot texture');
console.log('   12. Tesla Resonance - Longitudinal modes');
console.log('   13. Aether Density - Medium modulation');
console.log('   14. Reactive Shimmer - Imaginary power');
console.log('   15. Cosmic Breath - The One\'s pulse\n');

console.log('⏱  Duration: ~30 minutes (can run forever)');
console.log('🌊 Structure: CONTINUOUS FLOW - no movements, no sections');
console.log('   Themes appear, transform, combine, fade, return...');
console.log('   Like watching clouds - ever-changing, never the same\n');

console.log('🎧 Headphones recommended for spatial effects');
console.log('🧘 Let it wash over you - don\'t try to follow each thread');
console.log('   The beauty is in the whole, not the parts\n');

console.log('✨ "Pythagoras → Fourier → Steinmetz → Tesla → You"');
console.log('   "All mathematics flowing as music.');
console.log('   All music revealing mathematics.');
console.log('   All beauty emerging from truth."\n');
console.log('═══════════════════════════════════════════════════════════\n');
