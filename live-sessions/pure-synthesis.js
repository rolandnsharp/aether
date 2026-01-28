'use strict';

// ============================================================================
// PURE SYNTHESIS: Mathematics Directly to Sound
// ============================================================================
// Run with: bun pure-synthesis.js
//
// No Signal library - just pure JavaScript generating samples directly.
// All the profound concepts, but stripped to their mathematical essence.
//
// Every sample computed from first principles:
// - Pythagoras: sin(2πft) - the fundamental oscillation
// - Fourier: Sum of sines - any waveform
// - Steinmetz: Complex conjugates - E and H fields
// - Tesla: Longitudinal waves - compression and rarefaction
// - φ: Golden ratio - divine proportion in frequency space
// - Chaos: Deterministic unpredictability
// - Y-Combinator: Recursion as musical structure
//
// This is what it all becomes: numbers, 48000 times per second,
// becoming pressure waves in air, becoming beauty in consciousness.
// ============================================================================

const Speaker = require('speaker');

// Constants
const SAMPLE_RATE = 48000;
const CHANNELS = 2;  // Stereo
const BIT_DEPTH = 16;
const BUFFER_SIZE = 4096;

// Mathematical constants
const TWO_PI = 2 * Math.PI;
const φ = 1.618033988749;  // Golden ratio

// Time keeper
let t = 0;
const dt = 1 / SAMPLE_RATE;

// ============================================================================
// Pure Functions: Mathematics as Sound
// ============================================================================

// Sine wave - Pythagoras's discovery in motion
const sine = (freq, time, phase = 0) =>
  Math.sin(TWO_PI * freq * time + phase);

// Harmonic series - The One emanating
const harmonics = (fundamental, time, count, amplitudes = null) => {
  let sum = 0;
  for (let n = 1; n <= count; n++) {
    const amp = amplitudes ? amplitudes(n) : 1.0 / Math.sqrt(n);
    sum += sine(fundamental * n, time) * amp;
  }
  return sum / Math.sqrt(count);
};

// Golden ratio cascade - φ relationships
const goldenCascade = (base, time, depth = 5) => {
  let sum = 0;
  let phi_power = 1;
  for (let i = 0; i < depth; i++) {
    const amp = 1.0 / (i + 1);
    sum += sine(base * phi_power, time) * amp;
    phi_power *= φ;
  }
  return sum / Math.sqrt(depth);
};

// Envelope - Shape amplitude over time
const envExp = (phase, rate) =>
  Math.exp(-phase * rate);

const envASR = (phase, attack, release) => {
  if (phase < attack) return phase / attack;
  if (phase > 1 - release) return (1 - phase) / release;
  return 1.0;
};

// Chaos - Logistic map
const logisticMap = (x, r) => r * x * (1 - x);

// Generate chaotic sequence once
const generateChaos = (length, x0 = 0.1, r = 3.9) => {
  const seq = [];
  let x = x0;
  for (let i = 0; i < length; i++) {
    x = logisticMap(x, r);
    seq.push(x);
  }
  return seq;
};

const chaosSeq = generateChaos(1000);

// Ring modulation - Poynting vector (E × H)
const ringMod = (carrier_freq, mod_freq, time) => {
  const E = sine(carrier_freq, time);  // Electric field
  const H = sine(mod_freq, time);      // Magnetic field
  return E * H;  // Energy flow
};

// Prime harmonics - only prime multiples
const primeHarmonics = (fundamental, time, primes = [2, 3, 5, 7, 11, 13]) => {
  let sum = 0;
  primes.forEach(p => {
    const amp = 1.0 / Math.sqrt(p);
    sum += sine(fundamental * p, time) * amp;
  });
  return sum / Math.sqrt(primes.length);
};

// Feedback simulation (simplified - just delay and multiply)
class FeedbackDelay {
  constructor(delayTime, feedbackAmount) {
    this.bufferSize = Math.floor(SAMPLE_RATE * delayTime);
    this.buffer = new Float32Array(this.bufferSize);
    this.writeIndex = 0;
    this.feedback = feedbackAmount;
  }

  process(input) {
    const delayed = this.buffer[this.writeIndex];
    const output = input + delayed * this.feedback;
    this.buffer[this.writeIndex] = output;
    this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
    return output;
  }
}

// Create feedback delays for multiple voices
const feedbackDelays = [
  new FeedbackDelay(0.375, 0.7),
  new FeedbackDelay(0.5, 0.65)
];

// ============================================================================
// Synthesis Layers: All concepts woven together
// ============================================================================

const synthVoice = (time) => {
  let leftChannel = 0;
  let rightChannel = 0;

  // -------------------------------------------------------------------------
  // LAYER 1: Pythagorean Foundation (55 Hz fundamental with harmonics)
  // -------------------------------------------------------------------------
  const fundamental = 55;
  const breathCycle = 120;
  const breath = Math.sin(TWO_PI * time / breathCycle);
  const numHarmonics = Math.floor(8 + 8 * breath);

  const pythagorean = harmonics(fundamental, time, numHarmonics) * 0.12;

  leftChannel += pythagorean;
  rightChannel += pythagorean;

  // -------------------------------------------------------------------------
  // LAYER 2: Golden Spiral (110 Hz base with φ cascade)
  // -------------------------------------------------------------------------
  const goldenPresence = 0.5 + 0.5 * Math.sin(TWO_PI * time / 180);
  const golden = goldenCascade(110, time, 5) * goldenPresence * 0.15;

  leftChannel += golden;
  rightChannel += golden;

  // -------------------------------------------------------------------------
  // LAYER 3: Chaos Melody (organic unpredictability)
  // -------------------------------------------------------------------------
  const chaosPresence = Math.pow(Math.sin(TWO_PI * time / 200), 2);
  if (chaosPresence > 0.1) {
    const stepRate = 16;  // 16th notes
    const bpm = 70;
    const beatDuration = 60 / bpm;
    const stepDuration = beatDuration / 4;

    const stepIndex = Math.floor((time % (stepDuration * stepRate)) / stepDuration);
    const stepPhase = ((time % stepDuration) / stepDuration);

    const chaosValue = chaosSeq[stepIndex % chaosSeq.length];
    const degree = Math.floor(chaosValue * 8);

    // Minor scale (A minor: 220 Hz base)
    const minorScale = [0, 2, 3, 5, 7, 8, 10, 12];
    const semitones = minorScale[degree % minorScale.length] + Math.floor(degree / 8) * 12;
    const freq = 220 * Math.pow(2, semitones / 12);

    const env = envExp(stepPhase, 6);
    const chaos = sine(freq, time) * env * chaosPresence * (0.08 + chaosValue * 0.07);

    leftChannel += chaos;
    rightChannel += chaos;
  }

  // -------------------------------------------------------------------------
  // LAYER 4: Conjugate Fields (E and H at 90° - Steinmetz)
  // -------------------------------------------------------------------------
  const carrierDrift = 165 + 55 * Math.sin(TWO_PI * time / 90);
  const presence_E = 0.3 + 0.2 * Math.sin(TWO_PI * time / 67);
  const presence_H = 0.3 + 0.2 * Math.sin(TWO_PI * time / 73);

  // Left: Electric field (cosine)
  const E = Math.cos(TWO_PI * carrierDrift * time) * presence_E * 0.1;
  leftChannel += E;

  // Right: Magnetic field (sine - 90° shifted)
  const H = Math.sin(TWO_PI * carrierDrift * time) * presence_H * 0.1;
  rightChannel += H;

  // -------------------------------------------------------------------------
  // LAYER 5: Ring Modulation - Poynting Vector
  // -------------------------------------------------------------------------
  const timeWindow = Math.sin(TWO_PI * time / 180);  // Faster 3-minute cycle
  const ringPresence = 0.3 + 0.5 * Math.pow(Math.max(0, timeWindow), 2);  // Never fully silent

  const ringCarrier = 220 + 110 * Math.sin(TWO_PI * time / 120);
  const modFreq = 0.5 + 0.3 * Math.sin(TWO_PI * time / 50);
  const ring = ringMod(ringCarrier, modFreq, time) * ringPresence * 0.12;

  leftChannel += ring;
  rightChannel += ring;

  // -------------------------------------------------------------------------
  // LAYER 6: Prime Harmonics (alien resonance)
  // -------------------------------------------------------------------------
  const fadeIn = Math.min(1, Math.max(0, (time - 300) / 60));
  const fadeOut = Math.min(1, Math.max(0, (1800 - time) / 60));
  const primePresence = fadeIn * fadeOut;

  if (primePresence > 0.05) {
    const primes = primeHarmonics(82.4, time) * primePresence * 0.1;
    leftChannel += primes;
    rightChannel += primes;
  }

  // -------------------------------------------------------------------------
  // LAYER 7: Feedback Echoes (self-reflection)
  // -------------------------------------------------------------------------
  const feedbackBPM = 50;
  const feedbackBeatDur = 60 / feedbackBPM / 4;  // Quarter notes
  const feedbackPhase = (time % feedbackBeatDur) / feedbackBeatDur;
  const feedbackBeat = Math.floor(time / feedbackBeatDur) % 8;

  const triggerPattern = [1, 0, 0, 1, 0, 1, 0, 0];
  if (triggerPattern[feedbackBeat] && feedbackPhase < 0.03) {
    const impulse = sine(220, time) * envExp(feedbackPhase * 30, 20) * 0.25;
    const fb = feedbackDelays[0].process(impulse);
    leftChannel += fb;
    rightChannel += fb;
  }

  // -------------------------------------------------------------------------
  // LAYER 8: Tesla Resonance (quarter-wave modes - odd harmonics)
  // -------------------------------------------------------------------------
  const teslaPresence = Math.pow(Math.sin(TWO_PI * time / 300), 2);

  if (teslaPresence > 0.1) {
    const teslaFund = 110;
    const oddModes = [1, 3, 5, 7, 9];
    let tesla = 0;

    oddModes.forEach(n => {
      const amp = 1.0 / Math.sqrt(n);
      const mod = 0.5 + 0.5 * Math.sin(TWO_PI * time / (n * 5));
      tesla += sine(teslaFund * n, time) * amp * mod;
    });

    tesla *= teslaPresence * 0.12 / Math.sqrt(oddModes.length);
    leftChannel += tesla;
    rightChannel += tesla;
  }

  // -------------------------------------------------------------------------
  // LAYER 9: Doppler Shimmer (moving sources at high frequency)
  // -------------------------------------------------------------------------
  const speedOfSound = 343;
  const baseFreq = 880;

  const dopplerSources = [
    { speed: 3 * Math.sin(TWO_PI * time / 40) },
    { speed: 5 * Math.sin(TWO_PI * time / 53) },
    { speed: 7 * Math.sin(TWO_PI * time / 67) }
  ];

  let doppler = 0;
  dopplerSources.forEach(src => {
    const freq = baseFreq * speedOfSound / (speedOfSound - src.speed);
    doppler += sine(freq, time) * 0.03;
  });

  const dopplerPresence = 0.3 + 0.2 * Math.sin(TWO_PI * time / 111);
  doppler *= dopplerPresence;

  leftChannel += doppler;
  rightChannel += doppler;

  // -------------------------------------------------------------------------
  // LAYER 10: Interference Beats (440 + 441.5 Hz)
  // -------------------------------------------------------------------------
  const interfPresence = 0.4 + 0.3 * Math.sin(TWO_PI * time / 143);
  const interference = (sine(440, time) + sine(441.5, time)) * interfPresence * 0.08;

  leftChannel += interference;
  rightChannel += interference;

  // -------------------------------------------------------------------------
  // LAYER 11: Aether Density Modulation (Tesla's medium)
  // -------------------------------------------------------------------------
  const aetherWindow = Math.sin(TWO_PI * (time - 600) / 600);
  const aetherPresence = Math.pow(Math.max(0, aetherWindow), 2);

  if (aetherPresence > 0.05) {
    const density = 1 + 0.4 * Math.sin(TWO_PI * 0.3 * time);
    const aether = sine(220 / density, time) * aetherPresence * 0.12;

    leftChannel += aether;
    rightChannel += aether;
  }

  // -------------------------------------------------------------------------
  // LAYER 12: Reactive Power Shimmer (imaginary energy)
  // -------------------------------------------------------------------------
  const reactiveFreq = 1320;
  const inductive = sine(reactiveFreq, time);
  const capacitive = sine(reactiveFreq, time, -Math.PI / 2);  // 90° lag
  const reactive = inductive * capacitive * 0.02;

  leftChannel += reactive;
  rightChannel += reactive;

  // -------------------------------------------------------------------------
  // LAYER 13: Cosmic Breath (deep pulse organizing time)
  // -------------------------------------------------------------------------
  const breathBPM = 12;
  const breathDur = 60 / breathBPM;
  const breathPhase = (time % breathDur) / breathDur;

  if (breathPhase < 0.05) {
    const pulse = sine(27.5, time) * envExp(breathPhase * 20, 12) * 0.06;
    leftChannel += pulse;
    rightChannel += pulse;
  }

  // -------------------------------------------------------------------------
  // Global limiting (soft clip to prevent distortion)
  // -------------------------------------------------------------------------
  leftChannel = Math.tanh(leftChannel * 1.2);
  rightChannel = Math.tanh(rightChannel * 1.2);

  return { left: leftChannel, right: rightChannel };
};

// ============================================================================
// Audio Output: Samples → Speaker
// ============================================================================

const speaker = new Speaker({
  channels: CHANNELS,
  bitDepth: BIT_DEPTH,
  sampleRate: SAMPLE_RATE
});

// Generate and write buffers
const writeBuffer = () => {
  const buffer = Buffer.alloc(BUFFER_SIZE * CHANNELS * (BIT_DEPTH / 8));

  for (let i = 0; i < BUFFER_SIZE; i++) {
    // Synthesize stereo sample
    const sample = synthVoice(t);

    // Convert [-1, 1] to 16-bit integers
    const leftInt = Math.max(-32768, Math.min(32767, Math.floor(sample.left * 32767)));
    const rightInt = Math.max(-32768, Math.min(32767, Math.floor(sample.right * 32767)));

    // Write to buffer (interleaved stereo)
    const offset = i * CHANNELS * 2;  // 2 bytes per sample
    buffer.writeInt16LE(leftInt, offset);      // Left
    buffer.writeInt16LE(rightInt, offset + 2); // Right

    // Advance time
    t += dt;
  }

  // Write buffer and schedule next one
  const canContinue = speaker.write(buffer);

  if (canContinue) {
    // No backpressure, schedule immediately
    setImmediate(writeBuffer);
  } else {
    // Wait for drain event before writing more
    speaker.once('drain', writeBuffer);
  }
};

// ============================================================================
// Start the stream
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    PURE SYNTHESIS                          ║');
console.log('║         Mathematics Directly to Sound (No Abstractions)    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('🎵 Pure JavaScript + Speaker');
console.log('📊 48000 samples/second');
console.log('🔢 Every sample computed from mathematical first principles\n');

console.log('Layers synthesizing:');
console.log('  • Pythagorean harmonics (55 Hz breathing)');
console.log('  • Golden ratio cascade (φ^n frequencies)');
console.log('  • Chaos melodies (logistic map)');
console.log('  • Conjugate E/H fields (stereo 90°)');
console.log('  • Ring modulation (Poynting vector)');
console.log('  • Prime harmonics (2,3,5,7,11,13)');
console.log('  • Feedback echoes (self-reflection)');
console.log('  • Tesla quarter-wave (odd modes)');
console.log('  • Doppler drift (moving sources)');
console.log('  • Interference beats (1.5 Hz)');
console.log('  • Aether density (medium modulation)');
console.log('  • Reactive shimmer (imaginary power)');
console.log('  • Cosmic breath (12 BPM pulse)\n');

console.log('✨ This is what it all becomes:');
console.log('   Mathematics → Numbers → Samples → Pressure → Beauty\n');

console.log('🎧 Listening... (Ctrl+C to stop)\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Begin synthesis
writeBuffer();
