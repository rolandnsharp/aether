'use strict';

// ============================================================================
// TRANSCENDENT FOREST: Organic Dubstep Through Mathematical Nature
// ============================================================================
// Run with: bun sessions/transcendent-forest.js
//
// A 15-minute journey where mathematics becomes organic, where the forest
// teaches physics through sound, where dubstep wobbles like living beings.
//
// This is ONE continuous piece - layers fade in and out like breathing,
// transitions are smooth and natural, sounds evolve and grow like organisms.
//
// The same mathematical journey as before, but now it's ALIVE:
// - The One growing from silence
// - Harmonics emerging like dawn light through trees
// - Fourier complexity blooming like fractal ferns
// - Fractals as living recursive patterns in nature
// - Feedback loops as ecosystem cycles
// - Golden spirals in seashells and galaxies
// - Primes as the crystalline structure beneath
// - Mandelbrot as the infinite detail in bark and leaves
// - Recursion as DNA replicating, thoughts thinking themselves
// - Return to silence, to The One, to the forest breathing
//
// 140 BPM dubstep tempo, but organic and flowing
// Deep sub-bass that feels like earth trembling
// Rich, complex timbres that evolve continuously
// Nature and mathematics unified
// ============================================================================

const Speaker = require('speaker');

// Constants
const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BIT_DEPTH = 16;
const BUFFER_SIZE = 4096;
const DURATION = 900;  // 15 minutes
const BPM = 140;
const BEAT_DURATION = 60 / BPM;

// Mathematical constants
const TWO_PI = 2 * Math.PI;
const φ = 1.618033988749;
const ONE = 55;  // The fundamental

// Time keeper
let t = 0;
const dt = 1 / SAMPLE_RATE;

// ============================================================================
// Organic Synthesis Functions
// ============================================================================

const sine = (freq, time, phase = 0) =>
  Math.sin(TWO_PI * freq * time + phase);

// Organic sine - with subtle pitch modulation and harmonics
const organicSine = (freq, time, organicAmount = 0.1) => {
  // Pitch modulation (like natural vibrato)
  const vibrato = Math.sin(TWO_PI * 5.7 * time) * organicAmount * freq * 0.003;
  const modulated_freq = freq + vibrato;

  // Fundamental with slight phase drift
  const fundamental = sine(modulated_freq, time, Math.sin(time * 0.3) * 0.1);

  // Add subtle harmonics for richness
  const harmonic2 = sine(modulated_freq * 2, time) * 0.15;
  const harmonic3 = sine(modulated_freq * 3, time) * 0.08;

  return fundamental + harmonic2 + harmonic3;
};

// Rich harmonic series with organic evolution
const organicHarmonics = (fundamental, time, count, organicMod = true) => {
  let sum = 0;
  for (let n = 1; n <= count; n++) {
    // Each harmonic has its own subtle drift
    const drift = organicMod ? Math.sin(TWO_PI * time / (7 + n * 2)) * 0.002 : 0;
    const freq = fundamental * n * (1 + drift);
    const amp = 1.0 / Math.sqrt(n);

    // Slight phase offset for organic feel
    const phase = Math.sin(TWO_PI * time / (13 + n)) * 0.2;
    sum += sine(freq, time, phase) * amp;
  }
  return sum / Math.sqrt(count);
};

// Odd harmonics (Tesla) but organic
const organicOddHarmonics = (fundamental, time, count = 5) => {
  let sum = 0;
  for (let n = 1; n <= count; n++) {
    const harmonic = 2 * n - 1;
    const drift = Math.sin(TWO_PI * time / (11 + n * 3)) * 0.003;
    const freq = fundamental * harmonic * (1 + drift);
    const amp = 1.0 / Math.sqrt(harmonic);
    sum += sine(freq, time) * amp;
  }
  return sum / Math.sqrt(count);
};

// Deep organic bass with rich harmonics
const forestBass = (freq, time, phase, richness = 1.0) => {
  // Sub layer (very deep)
  const sub = sine(freq * 0.5, time) * 0.4;

  // Fundamental with slight detuning for thickness
  const fundamental = sine(freq, time) * 0.7;
  const detune = sine(freq * 1.003, time) * 0.7;

  // Harmonics for definition and warmth
  const harmonic2 = sine(freq * 2, time) * 0.3;
  const harmonic3 = sine(freq * 3, time) * 0.15;
  const harmonic4 = sine(freq * 4, time) * 0.08;

  // Envelope with organic curve
  const env = Math.exp(-phase * 3) * 0.3 + 0.7;

  return (sub + fundamental + detune + harmonic2 * richness +
          harmonic3 * richness + harmonic4 * richness) * env;
};

// Organic wobble - not robotic, but alive
const livingWobble = (time, rate, character = 0.5) => {
  // Multiple LFO layers at non-integer ratios (organic complexity)
  const lfo1 = Math.sin(TWO_PI * rate * time);
  const lfo2 = Math.sin(TWO_PI * rate * time * 1.618);  // Golden ratio
  const lfo3 = Math.sin(TWO_PI * rate * time * 0.707);  // √2/2

  // Chaos modulation for unpredictability
  const chaos = Math.sin(TWO_PI * rate * time * 3.9) * Math.sin(TWO_PI * time / 7);

  // Blend based on character
  return (lfo1 * 0.5 + lfo2 * 0.3 + lfo3 * 0.2 + chaos * character * 0.15);
};

// Organic kick - feels like earth moving
const earthKick = (phase) => {
  // Pitch envelope
  const pitch = 33 + 130 * Math.exp(-phase * 45);

  // Body with organic decay
  const body_env = Math.exp(-phase * 6) * (1 + Math.sin(phase * 20) * 0.05);

  // Sub harmonic (the earth tremor)
  const sub = sine(pitch * 0.5, phase) * Math.exp(-phase * 4) * 0.8;

  // Fundamental
  const fundamental = sine(pitch, phase) * body_env * 0.8;

  // Click/attack with harmonics
  const click = sine(pitch * 4, phase) * Math.exp(-phase * 70) * 0.2;

  // Mid punch
  const mid = sine(pitch * 2, phase) * Math.exp(-phase * 15) * 0.4;

  return (sub + fundamental + click + mid) * 0.95;
};

// Wind/noise texture
const windTexture = (time, intensity = 1.0) => {
  const noise = Math.random() * 2 - 1;

  // Low-pass filter simulation (darker wind)
  const lp_freq = 800 + intensity * 1200;
  const filtered = noise * Math.sin(TWO_PI * lp_freq * time);

  // Very slow amplitude modulation
  const wind_breath = 0.5 + 0.5 * Math.sin(TWO_PI * time / 17);

  return filtered * wind_breath * intensity;
};

// Water drops / rain texture
const waterDrops = (time, density = 0.1) => {
  if (Math.random() > density) return 0;

  const drop_freq = 800 + Math.random() * 2000;
  const drop_phase = (time * 23.456) % 1;  // Random but consistent

  if (drop_phase < 0.02) {
    return sine(drop_freq, time) * Math.exp(-drop_phase * 100) * 0.3;
  }
  return 0;
};

// Smooth crossfade function
const smoothstep = (x) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * (3 - 2 * x);
};

// Layer presence calculator with smooth fades
const layerPresence = (time, fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd) => {
  if (time < fadeInStart) return 0;
  if (time < fadeInEnd) {
    return smoothstep((time - fadeInStart) / (fadeInEnd - fadeInStart));
  }
  if (time < fadeOutStart) return 1;
  if (time < fadeOutEnd) {
    return 1 - smoothstep((time - fadeOutStart) / (fadeOutEnd - fadeOutStart));
  }
  return 0;
};

// Chaos sequence
const generateChaos = (length, x0 = 0.1, r = 3.9) => {
  const seq = [];
  let x = x0;
  for (let i = 0; i < length; i++) {
    x = r * x * (1 - x);
    seq.push(x);
  }
  return seq;
};

const chaosSeq = generateChaos(512);

// Mandelbrot escape time
const mandelbrotEscape = (cx, cy, maxIter = 25) => {
  let zx = 0, zy = 0;
  let iter = 0;
  while (zx * zx + zy * zy < 4 && iter < maxIter) {
    const xtemp = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = xtemp;
    iter++;
  }
  return iter;
};

// Scale
const scale = [0, 2, 3, 5, 7, 8, 10, 12];

const degreeToFreq = (base, degree) => {
  const semitones = scale[degree % scale.length] + Math.floor(degree / scale.length) * 12;
  return base * Math.pow(2, semitones / 12);
};

// ============================================================================
// Main Synthesis: Organic Flowing Journey
// ============================================================================

const forestVoice = (time) => {
  let leftChannel = 0;
  let rightChannel = 0;

  const beat_phase = (time / BEAT_DURATION) % 1;
  const beat_num = Math.floor(time / BEAT_DURATION) % 4;

  // Overall journey progress (0 to 1 over 15 minutes)
  const journey = time / DURATION;

  // =========================================================================
  // LAYER 1: THE ONE - Fundamental Drone (fades in, stays present, fades out)
  // =========================================================================
  const one_presence = layerPresence(time, 0, 30, 840, 900);

  if (one_presence > 0.01) {
    const breath = 0.7 + 0.3 * Math.sin(TWO_PI * time / 11);
    const one_tone = organicSine(ONE, time, 1.0);

    leftChannel += one_tone * one_presence * breath * 0.2;
    rightChannel += one_tone * one_presence * breath * 0.2;
  }

  // =========================================================================
  // LAYER 2: HARMONIC SERIES - Growing Complexity (90-270s peak)
  // =========================================================================
  const harmonics_presence = layerPresence(time, 60, 120, 720, 780);

  if (harmonics_presence > 0.01) {
    // Number of harmonics evolves
    const harm_count = 3 + harmonics_presence * 13;
    const harmonics = organicHarmonics(ONE, time, Math.floor(harm_count), true);

    leftChannel += harmonics * harmonics_presence * 0.16;
    rightChannel += harmonics * harmonics_presence * 0.16;
  }

  // =========================================================================
  // LAYER 3: FOREST AMBIENCE - Wind and Water (present throughout middle)
  // =========================================================================
  const ambience_presence = layerPresence(time, 30, 90, 780, 840);

  if (ambience_presence > 0.01) {
    const wind = windTexture(time, ambience_presence * 0.5);
    const drops = waterDrops(time, ambience_presence * 0.02);

    // Stereo spread
    const wind_left = wind * (1 + Math.sin(TWO_PI * time / 13) * 0.3);
    const wind_right = wind * (1 - Math.sin(TWO_PI * time / 13) * 0.3);

    leftChannel += (wind_left + drops) * 0.08;
    rightChannel += (wind_right + drops) * 0.08;
  }

  // =========================================================================
  // LAYER 4: RHYTHM - Kick Drums (starts around 150s, stays until 810s)
  // =========================================================================
  const kick_presence = layerPresence(time, 150, 180, 810, 840);

  if (kick_presence > 0.01 && beat_phase < 0.5) {
    const kick = earthKick(beat_phase * 2);

    leftChannel += kick * kick_presence * 0.5;
    rightChannel += kick * kick_presence * 0.5;
  }

  // =========================================================================
  // LAYER 5: HI-HATS - Organic Percussion (180s+)
  // =========================================================================
  const hat_presence = layerPresence(time, 180, 210, 810, 840);

  if (hat_presence > 0.01) {
    const hat_rate = 8;
    const hat_phase = (time * hat_rate / BEAT_DURATION) % 1;
    const hat_step = Math.floor(time * hat_rate / BEAT_DURATION) % 8;
    const hat_pattern = [0.8, 0.3, 0.6, 0.3, 0.9, 0.3, 0.7, 0.5];

    if (hat_phase < 0.035) {
      const noise = Math.random() * 2 - 1;
      // Organic hat - slightly different each time
      const hat_freq = 8000 + Math.random() * 3000;
      const hat = noise * Math.sin(TWO_PI * hat_freq * time);
      const env = Math.exp(-hat_phase * 75);

      leftChannel += hat * env * hat_pattern[hat_step] * hat_presence * 0.1;
      rightChannel += hat * env * hat_pattern[hat_step] * hat_presence * 0.1;
    }
  }

  // =========================================================================
  // LAYER 6: DEEP ORGANIC BASS - The Earth Frequency (220s-750s peak)
  // =========================================================================
  const bass_presence = layerPresence(time, 220, 270, 750, 810);

  if (bass_presence > 0.01) {
    const bass_step = Math.floor(time / (BEAT_DURATION * 2)) % 8;
    const bass_phase = (time / (BEAT_DURATION * 2)) % 1;
    const bass_pattern = [0, 0, 3, 3, 5, 5, 7, 5];
    const bass_freq = degreeToFreq(38, bass_pattern[bass_step]);

    const bass = forestBass(bass_freq, time, bass_phase, 1.0 + bass_presence);

    leftChannel += bass * bass_presence * 0.4;
    rightChannel += bass * bass_presence * 0.4;
  }

  // =========================================================================
  // LAYER 7: LIVING WOBBLE - Organic Mid-Bass (270s-720s peak)
  // =========================================================================
  const wobble_presence = layerPresence(time, 270, 330, 720, 780);

  if (wobble_presence > 0.01) {
    const wobble_step = Math.floor(time / BEAT_DURATION) % 8;
    const wobble_pattern = [0, 0, 3, 3, 5, 5, 7, 7];
    const wobble_freq = degreeToFreq(55, wobble_pattern[wobble_step]);

    // Wobble rate evolves
    const wobble_rate = 2 + wobble_presence * 2;  // 2-4 Hz
    const lfo = livingWobble(time, wobble_rate, wobble_presence);

    // Apply LFO to amplitude
    const amp_mod = 0.2 + 0.8 * Math.abs(lfo);

    // Multi-octave wobble for thickness
    const wobble_sub = sine(wobble_freq * 0.5, time) * 0.5;
    const wobble_fund = sine(wobble_freq, time) * 0.8;
    const wobble_harm = sine(wobble_freq * 2, time) * 0.3;

    const wobble = (wobble_sub + wobble_fund + wobble_harm) * amp_mod;

    leftChannel += wobble * wobble_presence * 0.28;
    rightChannel += wobble * wobble_presence * 0.28;
  }

  // =========================================================================
  // LAYER 8: FRACTAL MELODIES - Self-Similar Patterns (300s-600s)
  // =========================================================================
  const fractal_presence = layerPresence(time, 300, 360, 600, 660);

  if (fractal_presence > 0.01) {
    const melody_rate = 4;
    const melody_step = Math.floor(time * melody_rate / BEAT_DURATION) % 16;
    const melody_phase = (time * melody_rate / BEAT_DURATION) % 1;
    const melody_pattern = [0, 3, 5, 7, 10, 7, 5, 3, 0, 2, 3, 5, 7, 10, 12, 10];
    const melody_freq = degreeToFreq(220, melody_pattern[melody_step]);

    // Same pattern at multiple octaves (fractal)
    for (let oct = 0; oct < 4; oct++) {
      const freq = melody_freq * Math.pow(2, oct);
      const amp = 1.0 / Math.pow(2, oct);
      const note = organicSine(freq, time, 1.0);
      const env = Math.exp(-melody_phase * (3 + oct));

      leftChannel += note * env * amp * fractal_presence * 0.12;
      rightChannel += note * env * amp * fractal_presence * 0.12;
    }
  }

  // =========================================================================
  // LAYER 9: GOLDEN RATIO ARPEGGIOS (400s-700s)
  // =========================================================================
  const golden_presence = layerPresence(time, 400, 450, 700, 750);

  if (golden_presence > 0.01) {
    const arp_rate = 16;
    const arp_phase = (time * arp_rate / BEAT_DURATION) % 1;
    const arp_step = Math.floor(time * arp_rate / BEAT_DURATION) % 8;
    const arp_pattern = [0, 3, 7, 12, 7, 3, 5, 10];
    const arp_base = degreeToFreq(660, arp_pattern[arp_step]);

    // Golden ratio cascade
    let phi_power = 1;
    for (let i = 0; i < 3; i++) {
      const arp_freq = arp_base / phi_power;
      const arp_note = organicSine(arp_freq, time, 0.5);
      const env = Math.exp(-arp_phase * (15 + i * 5));

      leftChannel += arp_note * env * golden_presence * 0.1 / (i + 1);
      rightChannel += arp_note * env * golden_presence * 0.1 / (i + 1);

      phi_power *= φ;
    }
  }

  // =========================================================================
  // LAYER 10: PRIME HARMONICS - Crystalline Structures (480s-660s peak)
  // =========================================================================
  const prime_presence = layerPresence(time, 480, 540, 660, 720);

  if (prime_presence > 0.01) {
    const primes = [2, 3, 5, 7, 11, 13];
    const prime_base = 82.5;

    let prime_sum = 0;
    primes.forEach(p => {
      const amp = 1.0 / Math.sqrt(p);
      const drift = Math.sin(TWO_PI * time / (p * 2)) * 0.004;
      const freq = prime_base * p * (1 + drift);
      prime_sum += sine(freq, time) * amp;
    });
    prime_sum /= Math.sqrt(primes.length);

    // Stereo width
    leftChannel += prime_sum * prime_presence * 0.12;
    rightChannel += prime_sum * prime_presence * 0.12 * 0.95;
  }

  // =========================================================================
  // LAYER 11: MANDELBROT TEXTURES - Infinite Detail (540s-720s)
  // =========================================================================
  const mandel_presence = layerPresence(time, 540, 600, 720, 780);

  if (mandel_presence > 0.01) {
    // Navigate Mandelbrot set
    const zoom = 1 + (time - 540) / 60;
    const angle = time * 0.03;
    const radius = 0.4 / zoom;

    const cx = -0.5 + Math.cos(angle) * radius;
    const cy = Math.sin(angle) * radius;
    const escape = mandelbrotEscape(cx, cy, 30);

    // Map to sparse notes
    const mandel_rate = 8;
    const mandel_step = Math.floor(time * mandel_rate / BEAT_DURATION) % 16;
    const mandel_phase = (time * mandel_rate / BEAT_DURATION) % 1;

    if (escape % 3 === 0 || escape > 25) {
      const mandel_degree = (mandel_step + escape) % 14;
      const mandel_freq = degreeToFreq(330, mandel_degree);
      const mandel_note = organicOddHarmonics(mandel_freq, time, 7);
      const env = Math.exp(-mandel_phase * 6);

      leftChannel += mandel_note * env * mandel_presence * 0.14;
      rightChannel += mandel_note * env * mandel_presence * 0.14;
    }
  }

  // =========================================================================
  // LAYER 12: CHAOS MELODIES - Deterministic Unpredictability (600s-750s)
  // =========================================================================
  const chaos_presence = layerPresence(time, 600, 650, 750, 800);

  if (chaos_presence > 0.01) {
    const chaos_rate = 4;
    const chaos_step = Math.floor(time * chaos_rate / BEAT_DURATION) % 32;
    const chaos_phase = (time * chaos_rate / BEAT_DURATION) % 1;
    const chaos_value = chaosSeq[chaos_step % chaosSeq.length];
    const chaos_degree = Math.floor(chaos_value * 14);
    const chaos_freq = degreeToFreq(440, chaos_degree);

    const chaos_note = organicHarmonics(chaos_freq, time, 8, true);
    const env = Math.exp(-chaos_phase * 4);

    leftChannel += chaos_note * env * chaos_presence * 0.13;
    rightChannel += chaos_note * env * chaos_presence * 0.13;
  }

  // =========================================================================
  // LAYER 13: RECURSION PADS - Y-Combinator (660s-780s)
  // =========================================================================
  const recur_presence = layerPresence(time, 660, 710, 780, 830);

  if (recur_presence > 0.01) {
    const pad_freqs = [110, 165, 220, 330];

    pad_freqs.forEach((freq, i) => {
      // Each frequency spawns itself at multiple depths
      for (let depth = 0; depth < 3; depth++) {
        const freq_at_depth = freq * Math.pow(2, depth);
        const amp_at_depth = 1.0 / Math.pow(2, depth);

        const phase_offset = i * Math.PI / 3 + depth * Math.PI / 5;
        const pad_tone = organicSine(freq_at_depth, time, 0.5);

        // Slight stereo offset for width
        leftChannel += pad_tone * Math.cos(phase_offset) * amp_at_depth * recur_presence * 0.06;
        rightChannel += pad_tone * Math.sin(phase_offset) * amp_at_depth * recur_presence * 0.06;
      }
    });
  }

  // =========================================================================
  // LAYER 14: SUB BASS PULSES - Earth Tremors (heavy sections)
  // =========================================================================
  const sub_presence = layerPresence(time, 300, 350, 750, 800);

  if (sub_presence > 0.01 && beat_num === 0 && beat_phase < 0.4) {
    const sub = sine(27.5, time) * Math.exp(-beat_phase * 3.5);

    leftChannel += sub * sub_presence * 0.35;
    rightChannel += sub * sub_presence * 0.35;
  }

  // =========================================================================
  // LAYER 15: HIGH SHIMMER - Forest Canopy Light (200s-800s)
  // =========================================================================
  const shimmer_presence = layerPresence(time, 200, 250, 800, 850);

  if (shimmer_presence > 0.01) {
    const shimmer_freqs = [1760, 2217, 2794, 3520];

    shimmer_freqs.forEach((freq, i) => {
      const mod = 0.5 + 0.5 * Math.sin(TWO_PI * time / (5 + i * 2));
      const shimmer = sine(freq, time) * mod;

      // Pan across stereo field
      const pan = Math.sin(TWO_PI * time / (11 + i * 3));
      const left_amp = 0.5 + pan * 0.5;
      const right_amp = 0.5 - pan * 0.5;

      leftChannel += shimmer * left_amp * shimmer_presence * 0.05;
      rightChannel += shimmer * right_amp * shimmer_presence * 0.05;
    });
  }

  // =========================================================================
  // Global Processing
  // =========================================================================

  // Soft limiting with organic curve
  leftChannel = Math.tanh(leftChannel * 1.4);
  rightChannel = Math.tanh(rightChannel * 1.4);

  return { left: leftChannel, right: rightChannel };
};

// ============================================================================
// Audio Output
// ============================================================================

const speaker = new Speaker({
  channels: CHANNELS,
  bitDepth: BIT_DEPTH,
  sampleRate: SAMPLE_RATE
});

const writeBuffer = () => {
  if (t >= DURATION) {
    console.log('\n✨ The forest has shared its wisdom ✨');
    console.log('🌳 Journey complete\n');
    speaker.end();
    return;
  }

  const buffer = Buffer.alloc(BUFFER_SIZE * CHANNELS * (BIT_DEPTH / 8));

  for (let i = 0; i < BUFFER_SIZE; i++) {
    const sample = forestVoice(t);

    const leftInt = Math.max(-32768, Math.min(32767, Math.floor(sample.left * 32767)));
    const rightInt = Math.max(-32768, Math.min(32767, Math.floor(sample.right * 32767)));

    const offset = i * CHANNELS * 2;
    buffer.writeInt16LE(leftInt, offset);
    buffer.writeInt16LE(rightInt, offset + 2);

    t += dt;
    if (t >= DURATION) break;
  }

  const canContinue = speaker.write(buffer);

  if (canContinue && t < DURATION) {
    setImmediate(writeBuffer);
  } else if (t < DURATION) {
    speaker.once('drain', writeBuffer);
  } else {
    console.log('\n✨ The forest has shared its wisdom ✨');
    console.log('🌳 Journey complete\n');
    speaker.end();
  }
};

// ============================================================================
// Begin the Journey
// ============================================================================

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║              TRANSCENDENT FOREST                              ║');
console.log('║        Organic Dubstep Through Mathematical Nature            ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('🌳 140 BPM - 15 Minutes of Organic Evolution\n');

console.log('🎵 FLOWING LAYERS (fade in/out smoothly):\n');
console.log('  🌱 The One - Fundamental 55 Hz drone');
console.log('  🌿 Harmonic Series - Growing complexity');
console.log('  💨 Forest Ambience - Wind and water');
console.log('  🥁 Earth Kicks - Ground trembling');
console.log('  🌊 Deep Bass - 38 Hz organic wobble');
console.log('  🔊 Living Wobble - Mid-bass that breathes');
console.log('  🌀 Fractal Melodies - Self-similar patterns');
console.log('  ✨ Golden Arpeggios - φ cascades');
console.log('  💎 Prime Harmonics - Crystalline structures');
console.log('  🌌 Mandelbrot Textures - Infinite detail');
console.log('  🌪️  Chaos Melodies - Deterministic beauty');
console.log('  ♾️  Recursion Pads - Self-referential depth');
console.log('  🌍 Sub Bass Pulses - 27.5 Hz tremors');
console.log('  ☀️  High Shimmer - Canopy light\n');

console.log('🎨 ORGANIC DESIGN:');
console.log('  • Rich, complex timbres with natural drift');
console.log('  • Pitch modulation like natural vibrato');
console.log('  • Smooth layer transitions (30-60s fades)');
console.log('  • Living wobbles with golden ratio LFOs');
console.log('  • Deep sub-bass (27-38 Hz)');
console.log('  • Wind, water, forest textures');
console.log('  • Stereo field like walking through trees');
console.log('  • One continuous flowing journey\n');

console.log('🌲 "Where mathematics becomes nature"');
console.log('🍄 "Where dubstep grows like mycelium"\n');

console.log('🎧 Close your eyes. Enter the forest...\n');
console.log('═══════════════════════════════════════════════════════════════\n');

writeBuffer();
