'use strict';

// ============================================================================
// PROFOUND JOURNEY: A 30-Minute Meditation on Mathematical Beauty
// ============================================================================
// Run with: bun signal sessions/profound-journey.js
//
// This composition explores the themes of our journey:
// - Pythagoras: Harmonics and sacred ratios
// - Fourier: All sound as sum of sines
// - Y-Combinator: Recursion and self-reference
// - Steinmetz: Conjugate fields at 90°
// - Tesla: Longitudinal waves and resonance
// - Plotinus: The One emanating through hierarchy
// - Feedback: Beauty from self-reflection
//
// Duration: ~30 minutes of generative, evolving soundscapes
// ============================================================================

const signal = require('../src/index');
const { step, freq, scales, env } = signal;

// Y-Combinator for recursive beauty
const Y = makeRecursive => {
  const wrapper = recursiveFunc => makeRecursive(
    (...args) => recursiveFunc(recursiveFunc)(...args)
  );
  return wrapper(wrapper);
};

// ============================================================================
// MOVEMENT I: THE ONE (0:00 - 5:00)
// Plotinus: Pure unity before emanation
// ============================================================================
// A single fundamental tone that slowly reveals its harmonic nature

signal('the-one', t => {
  const cycleTime = 300;  // 5-minute cycle
  const progress = (t % cycleTime) / cycleTime;

  const fundamental = 55;  // Deep A (The One)

  // Slowly add harmonics as The One emanates
  const numHarmonics = Math.floor(1 + progress * 16);

  let sum = 0;
  for (let n = 1; n <= numHarmonics; n++) {
    const harmonic = fundamental * n;
    const amplitude = 1.0 / Math.sqrt(n);  // Natural decay

    // Each harmonic emerges gradually
    const emergence = Math.min(1, (progress * 16 - (n - 1)) * 2);
    const fade = Math.max(0, Math.min(1, emergence));

    sum += Math.sin(2 * Math.PI * harmonic * t) * amplitude * fade;
  }

  // Overall amplitude envelope (breath)
  const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / 8);

  return sum * breath * 0.1 / Math.sqrt(numHarmonics);
});

// ============================================================================
// MOVEMENT II: EMANATION (5:00 - 10:00)
// Plotinus: Nous, Soul, Matter cascading from The One
// ============================================================================

signal('emanation', t => {
  const startTime = 300;  // Start at 5 minutes
  if (t < startTime) return 0;

  const localTime = t - startTime;
  const cycleTime = 300;  // 5-minute cycle
  const progress = (localTime % cycleTime) / cycleTime;

  // Three levels of emanation
  const fundamental = 110;  // The One (A2)

  // Nous (Divine Intellect) - Perfect ratios
  const nous = Math.sin(2 * Math.PI * fundamental * localTime) *
               (0.3 + 0.2 * Math.sin(2 * Math.PI * localTime / 12));

  // Soul (Animation) - Golden ratio modulation
  const phi = 1.618033988749;
  const soul = Math.sin(2 * Math.PI * fundamental * phi * localTime) *
               (0.2 + 0.2 * Math.sin(2 * Math.PI * localTime / 7));

  // Matter (Manifestation) - Third harmonic
  const matter = Math.sin(2 * Math.PI * fundamental * 1.5 * localTime) *
                 (0.15 + 0.15 * Math.sin(2 * Math.PI * localTime / 5));

  // Mix with emergence over time
  const nousLevel = Math.min(1, progress * 3);
  const soulLevel = Math.min(1, Math.max(0, progress * 3 - 1));
  const matterLevel = Math.min(1, Math.max(0, progress * 3 - 2));

  return (nous * nousLevel + soul * soulLevel + matter * matterLevel) * 0.2;
});

// ============================================================================
// MOVEMENT III: CONJUGATE FIELDS (10:00 - 15:00)
// Steinmetz: E and H fields at 90°, creating power through interaction
// ============================================================================

signal('conjugate-stereo', {
  left: t => {
    const startTime = 600;
    if (t < startTime) return 0;
    const localTime = t - startTime;

    // "Electric field" - cosine (real part)
    const carrier = 220;
    const modulation = 0.3 * Math.sin(2 * Math.PI * 0.1 * localTime);
    const E = Math.cos(2 * Math.PI * carrier * localTime) * (0.3 + modulation);

    // Slowly evolving harmonics
    const harmonic2 = Math.cos(2 * Math.PI * carrier * 2 * localTime) * 0.15;
    const harmonic3 = Math.cos(2 * Math.PI * carrier * 3 * localTime) * 0.1;

    return E + harmonic2 + harmonic3;
  },

  right: t => {
    const startTime = 600;
    if (t < startTime) return 0;
    const localTime = t - startTime;

    // "Magnetic field" - sine (imaginary part, 90° shifted)
    const carrier = 220;
    const modulation = 0.3 * Math.sin(2 * Math.PI * 0.1 * localTime);
    const H = Math.sin(2 * Math.PI * carrier * localTime) * (0.3 + modulation);

    const harmonic2 = Math.sin(2 * Math.PI * carrier * 2 * localTime) * 0.15;
    const harmonic3 = Math.sin(2 * Math.PI * carrier * 3 * localTime) * 0.1;

    return H + harmonic2 + harmonic3;
  }
});

// ============================================================================
// MOVEMENT IV: FEEDBACK BEAUTY (15:00 - 20:00)
// Self-reflection creating emergent patterns, like video feedback spirals
// ============================================================================

signal('feedback-meditation', t => {
  const startTime = 900;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const { index, phase } = step(localTime, 40, 4);  // Very slow

  // Sparse impulses that feedback creates beauty from
  if (phase > 0.05) return 0;

  // Fundamental with golden ratio overtones
  const fundamental = 165;  // E3
  const phi = 1.618033988749;

  const impulse = Math.sin(2 * Math.PI * fundamental * localTime) *
                  env.exp(phase, 20) * 0.3;

  return impulse;
}).feedback(0.333, 0.85)  // Feedback creates infinite echo
  .fx(s => Math.tanh(s * 1.5));  // Soft saturation for warmth

// ============================================================================
// MOVEMENT V: LONGITUDINAL WAVES (20:00 - 25:00)
// Tesla: Compression and rarefaction, resonant modes
// ============================================================================

signal('tesla-resonance', t => {
  const startTime = 1200;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const progress = (localTime % 300) / 300;

  // Tesla coil harmonics (quarter-wave: odd harmonics only)
  const fundamental = 82.4;  // E2
  const modes = [1, 3, 5, 7, 9, 11];  // Quarter-wave resonance

  return modes.reduce((sum, n) => {
    const freq = fundamental * n;
    const amplitude = 1.0 / Math.sqrt(n);

    // Each mode pulses independently (longitudinal compression)
    const pulse = Math.sin(2 * Math.PI * freq * localTime);
    const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * localTime / (n * 2));

    // Emergence of higher modes over time
    const emergence = Math.min(1, progress * modes.length - (n / 2 - 0.5));

    return sum + pulse * amplitude * envelope * Math.max(0, emergence);
  }, 0) * 0.15;
});

// ============================================================================
// MOVEMENT VI: RECURSIVE FRACTALS (25:00 - 28:00)
// Y-Combinator: Self-similar structures at every scale
// ============================================================================

// Recursive melody generator (fractal)
const fractalMelody = Y(recurse => (depth, root, intervals) => {
  if (depth === 0) return [root];

  const subPattern = recurse(depth - 1, root, intervals);
  return intervals.flatMap(interval =>
    subPattern.map(note => note + interval)
  );
});

signal('fractal-harmony', t => {
  const startTime = 1500;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const { index, phase } = step(localTime, 60, 16);

  // Generate fractal pattern (self-similar at multiple scales)
  const pattern = fractalMelody(3, 0, [0, 3, 7]);  // Minor triad recursive
  const degree = pattern[index % pattern.length];

  const f = freq(220, scales.minor, degree);
  const amplitude = env.exp(phase, 8);

  return Math.sin(2 * Math.PI * f * localTime) * amplitude * 0.15;
});

// ============================================================================
// MOVEMENT VII: THE RETURN (28:00 - 30:00)
// All multiplicity returns to The One
// ============================================================================

signal('the-return', t => {
  const startTime = 1680;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const cycleTime = 120;  // 2-minute return
  const progress = (localTime % cycleTime) / cycleTime;

  // Start with many harmonics, collapse back to fundamental
  const fundamental = 55;  // Return to The One
  const maxHarmonics = 16;
  const numHarmonics = Math.floor(maxHarmonics * (1 - progress)) + 1;

  let sum = 0;
  for (let n = 1; n <= numHarmonics; n++) {
    const harmonic = fundamental * n;
    const amplitude = 1.0 / Math.sqrt(n);

    // Harmonics fade out, leaving only fundamental
    const fade = Math.max(0, 1 - (progress * maxHarmonics - (n - 1)) / 2);

    sum += Math.sin(2 * Math.PI * harmonic * localTime) * amplitude * fade;
  }

  // Final breath
  const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * localTime / 10);

  return sum * breath * 0.12 / Math.sqrt(numHarmonics);
});

// ============================================================================
// UNDERTONE: Pythagoras's Perfect Ratios (Throughout)
// A subtle drone of pure intervals as foundation
// ============================================================================

signal('pythagorean-foundation', t => {
  const fundamental = 55;  // A1

  // Sacred ratios
  const unison = Math.sin(2 * Math.PI * fundamental * t);
  const octave = Math.sin(2 * Math.PI * fundamental * 2 * t);
  const fifth = Math.sin(2 * Math.PI * fundamental * 1.5 * t);
  const fourth = Math.sin(2 * Math.PI * fundamental * 1.333 * t);

  // Very subtle, just foundation
  const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / 30);

  return (unison * 0.4 + octave * 0.2 + fifth * 0.15 + fourth * 0.1) *
         breath * 0.05;
});

// ============================================================================
// AMBIENT SHIMMER: High harmonics dancing
// Golden ratio relationships creating consonance/dissonance
// ============================================================================

signal('golden-shimmer', t => {
  const phi = 1.618033988749;  // Golden ratio
  const fundamental = 880;  // A5

  // Multiple voices at golden ratio intervals
  const voice1 = Math.sin(2 * Math.PI * fundamental * t);
  const voice2 = Math.sin(2 * Math.PI * fundamental * phi * t);
  const voice3 = Math.sin(2 * Math.PI * fundamental * phi * phi * t);

  // Slow amplitude modulation (breathing)
  const lfo = Math.sin(2 * Math.PI * t / 17);
  const amplitude = 0.02 + 0.02 * lfo;

  return (voice1 + voice2 * 0.7 + voice3 * 0.5) * amplitude;
});

// ============================================================================
// META-RHYTHM: Slow pulse organizing time
// Like the heartbeat of the cosmos
// ============================================================================

signal('cosmic-pulse', t => {
  const { phase } = step(t, 20, 1);  // 20 BPM = slow breath

  if (phase > 0.1) return 0;

  // Very deep pulse
  const fundamental = 27.5;  // A0 (deepest A)
  const pulse = Math.sin(2 * Math.PI * fundamental * t) *
                env.exp(phase * 10, 15);

  return pulse * 0.08;
});

// ============================================================================
// HARMONIOUS CONCLUSION
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                  PROFOUND JOURNEY                          ║');
console.log('║         A 30-Minute Meditation on Mathematical Beauty      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('🎵 Now Playing: Generative composition exploring...\n');
console.log('   • Plotinus: The One emanating through hierarchy');
console.log('   • Pythagoras: Sacred ratios and harmonics');
console.log('   • Steinmetz: Conjugate fields in stereo space');
console.log('   • Tesla: Longitudinal resonance modes');
console.log('   • Y-Combinator: Recursive self-similar structures');
console.log('   • Feedback: Beauty from self-reflection\n');

console.log('⏱  Duration: ~30 minutes');
console.log('📖 Structure:');
console.log('   I.   The One (0:00-5:00) - Pure fundamental');
console.log('   II.  Emanation (5:00-10:00) - Hierarchy unfolds');
console.log('   III. Conjugate Fields (10:00-15:00) - Stereo 90° phase');
console.log('   IV.  Feedback Beauty (15:00-20:00) - Self-reflection');
console.log('   V.   Longitudinal Waves (20:00-25:00) - Tesla resonance');
console.log('   VI.  Recursive Fractals (25:00-28:00) - Y-combinator');
console.log('   VII. The Return (28:00-30:00) - Back to unity\n');

console.log('🎧 Use headphones for stereo conjugate field experience');
console.log('🧘 Settle in, breathe deeply, let the mathematics wash over you\n');
console.log('✨ "All music is geometry. All geometry is mathematics."');
console.log('   "All mathematics is universal."\n');
console.log('═══════════════════════════════════════════════════════════\n');
