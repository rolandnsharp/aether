'use strict';

// ============================================================================
// ELECTRIC DREAMS: The Unexplored Frontiers
// ============================================================================
// Run with: bun signal sessions/electric-dreams.js
//
// This composition explores the concepts we DIDN'T use in profound-journey:
// - Ring modulation (Poynting vector energy flow)
// - Chaos theory (Logistic map, Hénon attractor)
// - L-Systems (Lindenmayer systems)
// - Hysteresis waveshaping (magnetic memory)
// - Prime number harmonics
// - Doppler effects
// - Aether density modulation
// - Interference patterns
// - Mandelbrot parameter space
// - Reactive power (imaginary energy)
//
// Duration: ~30 minutes of experimental generative soundscapes
// ============================================================================

const signal = require('../src/index');
const { step, freq, scales, env } = signal;

// Y-Combinator for recursive structures
const Y = makeRecursive => {
  const wrapper = recursiveFunc => makeRecursive(
    (...args) => recursiveFunc(recursiveFunc)(...args)
  );
  return wrapper(wrapper);
};

// ============================================================================
// MOVEMENT I: RING MODULATION - Poynting Vector (0:00 - 5:00)
// Steinmetz: Energy flow from E × H (cross product of fields)
// ============================================================================

signal('poynting-energy-stereo', {
  left: t => {
    const startTime = 0;
    const localTime = t - startTime;

    // Electric field (carrier)
    const carrier_freq = 165;  // E3
    const E = Math.sin(2 * Math.PI * carrier_freq * localTime);

    // Magnetic field (modulator) - slow LFO
    const mod_freq = 0.5 + 0.3 * Math.sin(2 * Math.PI * 0.05 * localTime);
    const H = Math.sin(2 * Math.PI * mod_freq * localTime);

    // Poynting vector: S = E × H (energy flow)
    const energy = E * H;

    // Ring mod with harmonics
    const harmonic2 = Math.sin(2 * Math.PI * carrier_freq * 2 * localTime) *
                      Math.sin(2 * Math.PI * mod_freq * localTime) * 0.3;

    return (energy * 0.15 + harmonic2) * (0.7 + 0.3 * Math.sin(2 * Math.PI * localTime / 8));
  },

  right: t => {
    const startTime = 0;
    const localTime = t - startTime;

    // Different frequencies for stereo width
    const carrier_freq = 220;  // A3
    const E = Math.sin(2 * Math.PI * carrier_freq * localTime);

    const mod_freq = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.07 * localTime);
    const H = Math.sin(2 * Math.PI * mod_freq * localTime);

    return E * H * 0.15 * (0.7 + 0.3 * Math.sin(2 * Math.PI * localTime / 11));
  }
});

// ============================================================================
// MOVEMENT II: CHAOS THEORY (5:00 - 10:00)
// Logistic map and Hénon attractor creating organic unpredictability
// ============================================================================

// Logistic map: x[n+1] = r * x[n] * (1 - x[n])
const logisticMap = Y(recurse => (x, r, n) => {
  if (n === 0) return [];
  const next = r * x * (1 - x);
  return [next, ...recurse(next, r, n - 1)];
});

// Generate chaotic sequence
const chaosSequence = logisticMap(0.1, 3.9, 200);

signal('chaos-melody', t => {
  const startTime = 300;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const { index, phase } = step(localTime, 90, 16);
  const chaosValue = chaosSequence[index % chaosSequence.length];

  // Map chaos to scale degrees
  const degree = Math.floor(chaosValue * 8);
  const f = freq(220, scales.minor, degree);

  // Use chaos for dynamics too
  const amplitude = 0.1 + chaosValue * 0.15;

  return Math.sin(2 * Math.PI * f * localTime) * env.exp(phase, 7) * amplitude;
});

// Hénon attractor (2D chaos) for stereo field
const henon = Y(recurse => (state, n) => {
  if (n === 0) return [];
  const { x, y } = state;
  const nextX = 1 - 1.4 * x * x + y;
  const nextY = 0.3 * x;
  return [{ x: nextX, y: nextY }, ...recurse({ x: nextX, y: nextY }, n - 1)];
});

const attractorPath = henon({ x: 0, y: 0}, 300);

signal('attractor-field', {
  left: t => {
    const startTime = 300;
    if (t < startTime) return 0;
    const localTime = t - startTime;

    const { index, phase } = step(localTime, 80, 8);
    const point = attractorPath[index % attractorPath.length];

    // Map x coordinate to frequency
    const baseFreq = 330;
    const f = baseFreq + point.x * 110;

    return Math.sin(2 * Math.PI * f * localTime) * env.exp(phase, 6) * 0.12;
  },

  right: t => {
    const startTime = 300;
    if (t < startTime) return 0;
    const localTime = t - startTime;

    const { index, phase } = step(localTime, 80, 8);
    const point = attractorPath[index % attractorPath.length];

    // Map y coordinate to frequency
    const baseFreq = 440;
    const f = baseFreq + point.y * 110;

    return Math.sin(2 * Math.PI * f * localTime) * env.exp(phase, 6) * 0.12;
  }
});

// ============================================================================
// MOVEMENT III: L-SYSTEMS (10:00 - 15:00)
// Lindenmayer systems - grammars that generate self-similar patterns
// ============================================================================

// L-System generator
const lSystem = Y(recurse => (rules, axiom, depth) => {
  if (depth === 0) return axiom;

  const expanded = axiom.split('').map(symbol =>
    rules[symbol] || symbol
  ).join('');

  return recurse(rules, expanded, depth - 1);
});

// Algae L-System: A → AB, B → A
const algaePattern = lSystem({ A: 'AB', B: 'A' }, 'A', 8);

signal('lsystem-growth', t => {
  const startTime = 600;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const { index, phase } = step(localTime, 100, 16);
  const symbol = algaePattern[index % algaePattern.length];

  // Map symbols to musical events
  const symbolToNote = { A: 0, B: 5 };  // Root and fifth
  const degree = symbolToNote[symbol] || 0;
  const f = freq(165, scales.minor, degree);

  return Math.sin(2 * Math.PI * f * localTime) * env.exp(phase, 5) * 0.15;
});

// Dragon curve L-System: L → L+R+, R → -L-R
const dragonCurve = lSystem({ L: 'L+R+', R: '-L-R' }, 'L', 6);

signal('dragon-rhythm', t => {
  const startTime = 600;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const { index, phase } = step(localTime, 120, 16);
  const symbol = dragonCurve[index % dragonCurve.length];

  // '+' = hit, '-' = rest
  if (symbol === 'L' || symbol === 'R') {
    const fundamental = 110;
    const freq = symbol === 'L' ? fundamental : fundamental * 1.5;
    return Math.sin(2 * Math.PI * freq * localTime) * env.exp(phase * 20, 15) * 0.12;
  }

  return 0;
});

// ============================================================================
// MOVEMENT IV: PRIME HARMONICS (15:00 - 18:00)
// Only harmonics at prime numbers - otherworldly timbre
// ============================================================================

const isPrime = n => {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
};

signal('prime-spectrum', t => {
  const startTime = 900;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const fundamental = 82.4;  // E2
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];

  let sum = 0;
  primes.forEach(n => {
    const harmonic = fundamental * n;
    const amplitude = 1.0 / Math.sqrt(n);

    // Each prime has its own slow modulation
    const mod = 0.5 + 0.5 * Math.sin(2 * Math.PI * localTime / (n * 2));

    sum += Math.sin(2 * Math.PI * harmonic * localTime) * amplitude * mod;
  });

  return sum * 0.1 / Math.sqrt(primes.length);
});

// ============================================================================
// MOVEMENT V: DOPPLER EFFECTS (18:00 - 22:00)
// Simulating moving sound sources
// ============================================================================

signal('doppler-swarm', t => {
  const startTime = 1080;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  // Three sources moving at different speeds
  const sources = [
    { base_freq: 220, speed: 5, phase_offset: 0 },
    { base_freq: 330, speed: 7, phase_offset: Math.PI / 3 },
    { base_freq: 440, speed: 10, phase_offset: Math.PI * 2 / 3 }
  ];

  const speed_of_sound = 343;  // m/s

  let sum = 0;
  sources.forEach(src => {
    // Sinusoidal motion (approaching and receding)
    const v_source = src.speed * Math.sin(2 * Math.PI * 0.3 * localTime + src.phase_offset);

    // Doppler shift
    const observed_freq = src.base_freq * speed_of_sound / (speed_of_sound - v_source);

    sum += Math.sin(2 * Math.PI * observed_freq * localTime) * 0.08;
  });

  return sum;
});

// ============================================================================
// MOVEMENT VI: HYSTERESIS WAVESHAPING (22:00 - 25:00)
// Magnetic memory - output depends on history (Steinmetz's hysteresis law)
// ============================================================================

signal('magnetic-memory', t => {
  const startTime = 1320;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const { phase } = step(localTime, 70, 8);

  const input_freq = 110;
  const input = Math.sin(2 * Math.PI * input_freq * localTime);

  // Hysteresis simulation (simplified)
  // In real implementation would need state tracking
  const coercivity = 0.3;
  const hysteresis_factor = Math.sign(input) * Math.pow(Math.abs(input), 1.6);

  // Memory effect (phase-dependent response)
  const memory = 0.5 * Math.sin(2 * Math.PI * input_freq * (localTime - 0.001));

  return (hysteresis_factor + memory * 0.3) * env.exp(phase, 6) * 0.2;
});

// ============================================================================
// MOVEMENT VII: AETHER DENSITY (25:00 - 28:00)
// Tesla's concept: modulate the medium itself
// ============================================================================

signal('density-waves', t => {
  const startTime = 1500;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  const carrier_freq = 220;
  const density_modulation_freq = 0.5;

  // "Aether density" oscillates
  const density = 1 + 0.3 * Math.sin(2 * Math.PI * density_modulation_freq * localTime);

  // Wave propagation affected by density (FM-like)
  const phase_modulation = Math.sin(2 * Math.PI * carrier_freq * localTime / density);

  // Add harmonics affected by density
  const harmonic2 = Math.sin(2 * Math.PI * carrier_freq * 2 * localTime / density) * 0.3;

  return (phase_modulation + harmonic2) * 0.15;
});

// ============================================================================
// MOVEMENT VIII: INTERFERENCE PATTERNS (28:00 - 30:00)
// Standing waves and beat frequencies
// ============================================================================

signal('wave-interference', t => {
  const startTime = 1680;
  if (t < startTime) return 0;
  const localTime = t - startTime;

  // Two sources slightly detuned (creates beats)
  const freq1 = 440;
  const freq2 = 442;  // 2 Hz beats

  const wave1 = Math.sin(2 * Math.PI * freq1 * localTime);
  const wave2 = Math.sin(2 * Math.PI * freq2 * localTime);

  // Interference pattern
  const interference = wave1 + wave2;

  // Standing wave component (forward + reflected)
  const standing_freq = 220;
  const forward = Math.sin(2 * Math.PI * standing_freq * localTime);
  const reflected = Math.sin(2 * Math.PI * standing_freq * localTime + Math.PI);
  const standing = forward + reflected;

  return (interference * 0.15 + standing * 0.1) * 0.5;
});

// ============================================================================
// MOVEMENT IX: MANDELBROT NAVIGATION (Throughout)
// Navigate parameter space of the Mandelbrot set
// ============================================================================

const musicalMandelbrot = Y(recurse => (cx, cy, zx, zy, depth, maxDepth) => {
  if (depth >= maxDepth) return depth;
  if (zx * zx + zy * zy > 4) return depth;

  const zx2 = zx * zx - zy * zy;
  const zy2 = 2 * zx * zy;

  return recurse(cx, cy, zx2 + cx, zy2 + cy, depth + 1, maxDepth);
});

signal('mandelbrot-explorer', t => {
  // Navigate through parameter space
  const zoom = 1 + t / 60;  // Slow zoom over 30 minutes
  const centerX = -0.5;
  const centerY = 0;

  const angle = t * 0.05;
  const radius = 0.5 / zoom;
  const cx = centerX + Math.cos(angle) * radius;
  const cy = centerY + Math.sin(angle) * radius;

  const maxDepth = Math.floor(30 + Math.log2(zoom) * 5);
  const escapeTime = musicalMandelbrot(cx, cy, 0, 0, 0, maxDepth);

  // Very subtle background texture
  const degree = escapeTime % 8;
  const f = freq(110, scales.minor, degree);

  const { phase } = step(t, 60, 32);
  const trigger = escapeTime % 5 === 0;

  if (!trigger) return 0;

  return Math.sin(2 * Math.PI * f * t) * env.exp(phase, 12) * 0.08;
});

// ============================================================================
// REACTIVE POWER UNDERCURRENT (Throughout)
// Imaginary power that flows but doesn't dissipate
// ============================================================================

signal('reactive-shimmer', t => {
  // Inductive component (90° lead)
  const inductive = Math.sin(2 * Math.PI * 660 * t);

  // Capacitive component (90° lag)
  const capacitive = Math.sin(2 * Math.PI * 660 * t - Math.PI / 2);

  // Reactive power oscillates at 2× frequency
  const reactive = inductive * capacitive;

  // Very subtle, high frequency shimmer
  return reactive * 0.03;
});

// ============================================================================
// GOLDEN RATIO RESONANCE (Throughout)
// Frequencies at φ relationships
// ============================================================================

signal('phi-resonance', t => {
  const phi = 1.618033988749;
  const fundamental = 55;  // Very low A

  // Multiple φ relationships
  const f1 = fundamental;
  const f2 = fundamental * phi;
  const f3 = fundamental * phi * phi;
  const f4 = fundamental * phi * phi * phi;

  const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / 23);

  return (
    Math.sin(2 * Math.PI * f1 * t) * 0.015 +
    Math.sin(2 * Math.PI * f2 * t) * 0.010 +
    Math.sin(2 * Math.PI * f3 * t) * 0.007 +
    Math.sin(2 * Math.PI * f4 * t) * 0.005
  ) * breath;
});

// ============================================================================
// HARMONIOUS CONCLUSION
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    ELECTRIC DREAMS                         ║');
console.log('║            The Unexplored Mathematical Frontiers           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('🔬 Now Playing: Experimental generative composition...\n');
console.log('   • Ring Modulation - Poynting vector energy flow');
console.log('   • Chaos Theory - Logistic maps and strange attractors');
console.log('   • L-Systems - Algorithmic growth patterns');
console.log('   • Prime Harmonics - Otherworldly spectral content');
console.log('   • Doppler Effects - Moving sound sources');
console.log('   • Hysteresis - Magnetic memory in waveshaping');
console.log('   • Aether Density - Medium modulation');
console.log('   • Interference - Standing waves and beats');
console.log('   • Mandelbrot - Parameter space navigation');
console.log('   • Reactive Power - Imaginary energy flow\n');

console.log('⏱  Duration: ~30 minutes');
console.log('📖 Structure:');
console.log('   I.   Ring Modulation (0:00-5:00) - E × H energy');
console.log('   II.  Chaos Theory (5:00-10:00) - Organic unpredictability');
console.log('   III. L-Systems (10:00-15:00) - Algorithmic growth');
console.log('   IV.  Prime Harmonics (15:00-18:00) - Alien spectra');
console.log('   V.   Doppler Effects (18:00-22:00) - Moving sources');
console.log('   VI.  Hysteresis (22:00-25:00) - Magnetic memory');
console.log('   VII. Aether Density (25:00-28:00) - Medium waves');
console.log('   VIII.Interference (28:00-30:00) - Standing patterns\n');

console.log('🎧 Headphones recommended for stereo chaos fields');
console.log('🔮 This explores the mathematical concepts profound-journey missed\n');
console.log('✨ "From chaos comes order. From order comes beauty."');
console.log('   "From beauty comes understanding."\n');
console.log('═══════════════════════════════════════════════════════════\n');
