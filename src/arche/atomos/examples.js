/**
 * Atomos (Air 💨) Examples
 * Discrete generative synthesis
 */

import { Atomos } from './index.js';

// ============================================================================
// Example 1: Simple Counter
// ============================================================================

const counter = Atomos.register('counter', (state, dt) => {
  if (!state.count) state.count = 0;
  state.count++;
  return state.count;
});

// Usage:
// const gen = Atomos.create(counter.fn);
// gen.step();  // 1
// gen.step();  // 2
// gen.step();  // 3

// ============================================================================
// Example 2: Euclidean Rhythm Generator
// ============================================================================

const euclidean = Atomos.register('euclidean-rhythm', (state, dt) => {
  // Euclidean rhythm: distribute k hits across n steps
  if (!state.k) state.k = 3;  // 3 hits
  if (!state.n) state.n = 8;  // in 8 steps
  if (!state.step) state.step = 0;

  // Bresenham's algorithm
  const threshold = state.step * state.k;
  const prevThreshold = (state.step - 1) * state.k;
  const hit = Math.floor(threshold / state.n) > Math.floor(prevThreshold / state.n);

  state.step = (state.step + 1) % state.n;

  return hit ? 1 : 0;
});

// ============================================================================
// Example 3: Cyclic Pattern
// ============================================================================

const melody = Atomos.cycle([440, 550, 660, 550]);  // A-C#-E-C# pattern

// ============================================================================
// Example 4: Random Walk
// ============================================================================

const randomWalk = Atomos.register('random-walk', (state, dt) => {
  if (!state.position) state.position = 0;

  // Random step up or down
  const step = Math.random() < 0.5 ? -1 : 1;
  state.position += step;

  // Clamp to range
  state.position = Math.max(-10, Math.min(10, state.position));

  // Map to frequency
  return 440 * Math.pow(2, state.position / 12);  // Chromatic scale
});

// ============================================================================
// Example 5: Markov Chain Melody
// ============================================================================

const markovMelody = Atomos.markov({
  'C': [
    { next: 'D', probability: 0.3 },
    { next: 'E', probability: 0.3 },
    { next: 'G', probability: 0.2 },
    { next: 'C', probability: 0.2 }
  ],
  'D': [
    { next: 'C', probability: 0.3 },
    { next: 'E', probability: 0.4 },
    { next: 'F', probability: 0.3 }
  ],
  'E': [
    { next: 'D', probability: 0.3 },
    { next: 'F', probability: 0.3 },
    { next: 'G', probability: 0.4 }
  ],
  'F': [
    { next: 'E', probability: 0.4 },
    { next: 'G', probability: 0.4 },
    { next: 'C', probability: 0.2 }
  ],
  'G': [
    { next: 'F', probability: 0.3 },
    { next: 'E', probability: 0.3 },
    { next: 'C', probability: 0.4 }
  ]
}, 'C');

Atomos.register('markov-melody', markovMelody);

// ============================================================================
// Example 6: L-System (Algae Growth)
// ============================================================================

const algae = Atomos.lsystem({
  'A': 'AB',
  'B': 'A'
}, 'A', 1);

Atomos.register('algae', algae);

// Usage:
// gen.step(); // "AB"
// gen.step(); // "ABA"
// gen.step(); // "ABAAB"
// gen.step(); // "ABAABABA"

// ============================================================================
// Example 7: L-System (Fractal Tree)
// ============================================================================

const tree = Atomos.lsystem({
  'F': 'FF',
  'X': 'F-[[X]+X]+F[+FX]-X'
}, 'X', 1);

Atomos.register('fractal-tree', tree);

// ============================================================================
// Example 8: Particle System (1D)
// ============================================================================

const particles = Atomos.register('particles', (state, dt) => {
  if (!state.particles) {
    state.particles = Array.from({ length: 10 }, (_, i) => ({
      pos: Math.random() * 100,
      vel: Math.random() * 2 - 1,
      life: 1.0
    }));
  }

  // Update particles
  for (const p of state.particles) {
    p.pos += p.vel * dt * 60;  // Scale by 60 for visible movement
    p.life -= dt;

    // Respawn dead particles
    if (p.life <= 0) {
      p.pos = Math.random() * 100;
      p.vel = Math.random() * 2 - 1;
      p.life = 1.0;
    }
  }

  // Return average position as audio signal
  const avgPos = state.particles.reduce((sum, p) => sum + p.pos, 0) / state.particles.length;
  return Math.sin(avgPos * 0.1);  // Convert to audio
});

// ============================================================================
// Example 9: Cellular Automaton (Rule 110)
// ============================================================================

const rule110 = Atomos.register('rule110', (state, dt) => {
  if (!state.cells) {
    state.cells = new Array(64).fill(0);
    state.cells[32] = 1;  // Single cell in middle
  }

  const rules = {
    '111': 0, '110': 1, '101': 1, '100': 0,
    '011': 1, '010': 1, '001': 1, '000': 0
  };

  // Compute next generation
  const next = new Array(state.cells.length).fill(0);
  for (let i = 1; i < state.cells.length - 1; i++) {
    const left = state.cells[i - 1];
    const center = state.cells[i];
    const right = state.cells[i + 1];
    const key = `${left}${center}${right}`;
    next[i] = rules[key] || 0;
  }

  state.cells = next;

  // Convert to audio (count active cells)
  const active = state.cells.reduce((sum, c) => sum + c, 0);
  return (active / state.cells.length) * 2 - 1;  // Normalize to [-1, 1]
});

// ============================================================================
// Example 10: Generative Drum Pattern
// ============================================================================

const drums = Atomos.register('generative-drums', (state, dt) => {
  if (!state.step) state.step = 0;

  const kick = [1, 0, 0, 0, 1, 0, 0, 0];
  const snare = [0, 0, 1, 0, 0, 0, 1, 0];
  const hihat = Atomos.choose([0, 1])(state, dt);  // Random hihats

  const kickHit = kick[state.step % 8];
  const snareHit = snare[state.step % 8];
  const hihatHit = hihat;

  state.step++;

  return {
    kick: kickHit,
    snare: snareHit,
    hihat: hihatHit
  };
});

// ============================================================================
// Example 11: Brownian Motion (Audio)
// ============================================================================

const brownian = Atomos.register('brownian', (state, dt) => {
  if (!state.value) state.value = 0;

  // Random walk with damping
  state.value += (Math.random() * 2 - 1) * 0.1;
  state.value *= 0.99;  // Damping

  return state.value;
});

// ============================================================================
// Example 12: Fibonacci Sequence
// ============================================================================

const fibonacci = Atomos.register('fibonacci', (state, dt) => {
  if (!state.a) state.a = 0;
  if (!state.b) state.b = 1;

  const next = state.a + state.b;
  state.a = state.b;
  state.b = next;

  // Map to frequency (modulo to keep in range)
  return 110 * Math.pow(2, (next % 12) / 12);
});

// ============================================================================
// Example 13: Chaos (Logistic Map)
// ============================================================================

const logistic = Atomos.register('logistic-map', (state, dt) => {
  if (!state.x) state.x = 0.1;
  if (!state.r) state.r = 3.9;  // Chaos parameter

  // x[n+1] = r * x[n] * (1 - x[n])
  state.x = state.r * state.x * (1 - state.x);

  // Map to audio range
  return state.x * 2 - 1;
});

// ============================================================================
// Example 14: Weighted Random Melody
// ============================================================================

const weightedMelody = Atomos.weighted([
  { value: 440, weight: 3 },   // A (common)
  { value: 494, weight: 2 },   // B (less common)
  { value: 523, weight: 3 },   // C (common)
  { value: 587, weight: 1 },   // D (rare)
  { value: 659, weight: 2 },   // E (less common)
  { value: 698, weight: 1 }    // F (rare)
]);

Atomos.register('weighted-melody', weightedMelody);

// ============================================================================
// Example 15: Combine Multiple Generators
// ============================================================================

const combined = Atomos.register('combined', (state, dt) => {
  // Get rhythm from euclidean
  const rhythm = euclidean.fn(state, dt);

  // Get pitch from markov
  const note = markovMelody(state, dt);

  // Map note to frequency
  const noteToFreq = {
    'C': 261.63,
    'D': 293.66,
    'E': 329.63,
    'F': 349.23,
    'G': 392.00
  };

  return rhythm ? noteToFreq[note] : 0;
});

// ============================================================================
// Example 16: Convert to Audio Rate
// ============================================================================

// Run Atomos generator at audio rate (48kHz)
const atomosAsAudio = Atomos.toAudioRate(
  euclidean.fn,
  48000,
  { k: 3, n: 8 }
);

// Can now use in Rhythmos or as audio signal

// ============================================================================
// Example 17: Run for N steps
// ============================================================================

// Generate 16 notes from markov chain
const sequence = Atomos.generate(markovMelody, 16, 1/4, {});
console.log('Generated sequence:', sequence);

// ============================================================================
// Export all examples
// ============================================================================

export const examples = {
  counter,
  euclidean,
  melody,
  randomWalk,
  markovMelody,
  algae,
  tree,
  particles,
  rule110,
  drums,
  brownian,
  fibonacci,
  logistic,
  weightedMelody,
  combined,
  atomosAsAudio
};

export default examples;
