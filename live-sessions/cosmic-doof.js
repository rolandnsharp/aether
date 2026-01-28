'use strict';

// ============================================================================
// COSMIC DOOF: A Dance Floor Education on the Structure of the Universe
// ============================================================================
// Run with: bun sessions/cosmic-doof.js
//
// "They came to dance. They left understanding the fundamental nature of reality."
//
// This is a 15-minute journey through the mathematical foundations of existence,
// delivered at 138 BPM with DEEP bass that shakes your soul.
//
// Each section teaches a concept through direct sonic experience:
//
// 1. THE ONE (0:00-1:30)
//    - Fundamental tone - all emanates from unity
//    - Pythagoras: the first vibration
//
// 2. HARMONIC EMANATION (1:30-3:00)
//    - Overtone series - the natural law of vibration
//    - Each harmonic is a perfect ratio (1:2:3:4:5...)
//
// 3. FOURIER SYNTHESIS (3:00-4:30)
//    - Any waveform is just sines added together
//    - Complexity emerges from simple oscillation
//    - Build up to first drop
//
// 4. DROP 1: FRACTAL SELF-SIMILARITY (4:30-6:30)
//    - Same pattern at every scale
//    - The universe is a fractal hologram
//    - Bass frequencies mirror high frequencies
//
// 5. FEEDBACK LOOPS (6:30-8:00)
//    - Self-reference creates infinite beauty
//    - Output becomes input becomes output...
//    - The universe computing itself
//
// 6. GOLDEN SPIRAL (8:00-9:00)
//    - φ ratio everywhere: galaxies, DNA, music
//    - Build up using golden frequencies
//
// 7. DROP 2: PRIME DECOMPOSITION (9:00-11:00)
//    - Everything breaks down to primes
//    - Fundamental building blocks of mathematics
//    - Alien harmonics only on prime ratios
//
// 8. MANDELBROT COMPLEXITY (11:00-12:30)
//    - Infinite detail from simple iteration
//    - Z → Z² + C creating infinite worlds
//
// 9. Y-COMBINATOR RECURSION (12:30-13:30)
//    - Functions calling themselves
//    - Recursion as the structure of existence
//
// 10. RETURN TO THE ONE (13:30-15:00)
//     - All complexity collapses back to unity
//     - The journey completes the circle
//
// ============================================================================

const Speaker = require('speaker');

// Constants
const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BIT_DEPTH = 16;
const BUFFER_SIZE = 4096;
const DURATION = 900;  // 15 minutes
const BPM = 138;
const BEAT_DURATION = 60 / BPM;

// Mathematical constants
const TWO_PI = 2 * Math.PI;
const φ = 1.618033988749;  // Golden ratio
const ONE = 55;  // The fundamental (A1 - 55 Hz)

// Time keeper
let t = 0;
const dt = 1 / SAMPLE_RATE;

// ============================================================================
// Mathematical Functions
// ============================================================================

const sine = (freq, time, phase = 0) =>
  Math.sin(TWO_PI * freq * time + phase);

const saw = (freq, time) => {
  const phase = (freq * time) % 1;
  return 2 * phase - 1;
};

// Harmonic series (Pythagoras) - the natural emanation
const harmonicSeries = (fundamental, time, count, amplitudeFunc = null) => {
  let sum = 0;
  for (let n = 1; n <= count; n++) {
    const amp = amplitudeFunc ? amplitudeFunc(n) : 1.0 / n;
    sum += sine(fundamental * n, time) * amp;
  }
  return sum / Math.sqrt(count);
};

// Odd harmonics only (Tesla quarter-wave)
const oddHarmonics = (fundamental, time, count) => {
  let sum = 0;
  for (let n = 1; n <= count; n++) {
    const harmonic = 2 * n - 1;
    const amp = 1.0 / Math.sqrt(harmonic);
    sum += sine(fundamental * harmonic, time) * amp;
  }
  return sum / Math.sqrt(count);
};

// Prime harmonics only (alien frequencies)
const primeHarmonics = (fundamental, time, primes = [2, 3, 5, 7, 11, 13, 17]) => {
  let sum = 0;
  primes.forEach(p => {
    const amp = 1.0 / Math.sqrt(p);
    sum += sine(fundamental * p, time) * amp;
  });
  return sum / Math.sqrt(primes.length);
};

// Golden ratio cascade
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

// Fractal frequency - same pattern at multiple octaves
const fractalVoice = (base, time, octaves = 5) => {
  let sum = 0;
  for (let i = 0; i < octaves; i++) {
    const freq = base * Math.pow(2, i);
    const amp = 1.0 / Math.pow(2, i);
    sum += sine(freq, time) * amp;
  }
  return sum / Math.sqrt(octaves);
};

// Mandelbrot iteration (simplified for audio)
const mandelbrotEscape = (cx, cy, maxIter = 20) => {
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

// Logistic map (chaos)
const logisticMap = (x, r) => r * x * (1 - x);

// Generate chaos sequence
const generateChaos = (length, x0 = 0.1, r = 3.9) => {
  const seq = [];
  let x = x0;
  for (let i = 0; i < length; i++) {
    x = logisticMap(x, r);
    seq.push(x);
  }
  return seq;
};

const chaosSeq = generateChaos(512);

// PROPER club kick
const kickDrum = (phase) => {
  const pitch = 35 + 120 * Math.exp(-phase * 40);
  const body_env = Math.exp(-phase * 7);
  const click_env = Math.exp(-phase * 60);
  const body = Math.sin(TWO_PI * pitch * phase) * body_env;
  const click = Math.sin(TWO_PI * pitch * 5 * phase) * click_env * 0.25;
  const sub = Math.sin(TWO_PI * pitch * 0.5 * phase) * body_env * 0.7;
  return (body + click + sub) * 0.9;
};

// Deep bass line
const deepBass = (freq, time, phase) => {
  const fundamental = sine(freq, time) * 0.65;
  const harmonic1 = sine(freq * 2, time) * 0.3;
  const harmonic2 = sine(freq * 3, time) * 0.15;
  const env = Math.exp(-phase * 3.5) * 0.4 + 0.6;
  return (fundamental + harmonic1 + harmonic2) * env;
};

// Super saw with feedback-like thickness
const superSaw = (freq, time, voices = 7, detune = 0.03) => {
  let sum = 0;
  for (let i = 0; i < voices; i++) {
    const offset = (i - voices / 2) * detune;
    sum += saw(freq * (1 + offset), time);
  }
  return sum / voices;
};

// Scales
const scale = [0, 2, 3, 5, 7, 8, 10, 12];  // Natural minor

const degreeToFreq = (base, degree) => {
  const semitones = scale[degree % scale.length] + Math.floor(degree / scale.length) * 12;
  return base * Math.pow(2, semitones / 12);
};

// Get section
const getSection = (time) => {
  if (time < 90) return 0;    // The One
  if (time < 180) return 1;   // Harmonic Emanation
  if (time < 270) return 2;   // Fourier Synthesis (build)
  if (time < 390) return 3;   // DROP 1: Fractals
  if (time < 480) return 4;   // Feedback Loops
  if (time < 540) return 5;   // Golden Spiral (build)
  if (time < 660) return 6;   // DROP 2: Prime Decomposition
  if (time < 750) return 7;   // Mandelbrot Complexity
  if (time < 810) return 8;   // Y-Combinator Recursion
  return 9;                   // Return to The One
};

// ============================================================================
// Main Synthesis Engine: Teaching Through Sound
// ============================================================================

const cosmicDoof = (time) => {
  let leftChannel = 0;
  let rightChannel = 0;

  const section = getSection(time);
  const beat_phase = (time / BEAT_DURATION) % 1;
  const beat_num = Math.floor(time / BEAT_DURATION) % 4;

  // -------------------------------------------------------------------------
  // RHYTHM SECTION (present in most sections)
  // -------------------------------------------------------------------------

  // Kick drum (every beat in sections 3, 4, 6, 7)
  if (section >= 3 && section !== 5 && section !== 9) {
    if (beat_phase < 0.5) {
      const kick = kickDrum(beat_phase * 2);
      leftChannel += kick * 0.55;
      rightChannel += kick * 0.55;
    }
  }

  // Hi-hats (sections 2+)
  if (section >= 2 && section !== 9) {
    const hat_rate = 8;
    const hat_phase = (time * hat_rate / BEAT_DURATION) % 1;
    const hat_step = Math.floor(time * hat_rate / BEAT_DURATION) % 8;
    const hat_pattern = [0.8, 0.3, 0.6, 0.3, 0.9, 0.3, 0.7, 0.5];

    if (hat_phase < 0.04) {
      const noise_val = Math.random() * 2 - 1;
      const hat = noise_val * Math.sin(TWO_PI * 9000 * time);
      const env = Math.exp(-hat_phase * 70);
      leftChannel += hat * env * hat_pattern[hat_step] * 0.12;
      rightChannel += hat * env * hat_pattern[hat_step] * 0.12;
    }
  }

  // Clap (on 2 and 4 in drops)
  if ((section === 3 || section === 6) && (beat_num === 1 || beat_num === 3)) {
    if (beat_phase < 0.08) {
      const noise_val = Math.random() * 2 - 1;
      const clap = noise_val * Math.sin(TWO_PI * 2200 * time);
      const env = Math.exp(-beat_phase * 28);
      leftChannel += clap * env * 0.22;
      rightChannel += clap * env * 0.22;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 0: THE ONE (0:00-1:30)
  // Pure fundamental tone - all emanates from unity
  // -------------------------------------------------------------------------
  if (section === 0) {
    const presence = Math.sin(TWO_PI * time / 90);  // Fade in and out
    const one = sine(ONE, time);

    // Breathing amplitude
    const breath = 0.7 + 0.3 * Math.sin(TWO_PI * time / 8);

    leftChannel += one * presence * breath * 0.25;
    rightChannel += one * presence * breath * 0.25;

    // Add second and third harmonic slowly
    if (time > 30) {
      const harmonic2 = sine(ONE * 2, time) * (time - 30) / 60;
      leftChannel += harmonic2 * presence * 0.15;
      rightChannel += harmonic2 * presence * 0.15;
    }
    if (time > 60) {
      const harmonic3 = sine(ONE * 3, time) * (time - 60) / 30;
      leftChannel += harmonic3 * presence * 0.1;
      rightChannel += harmonic3 * presence * 0.1;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 1: HARMONIC EMANATION (1:30-3:00)
  // The overtone series - nature's perfect mathematics
  // -------------------------------------------------------------------------
  if (section === 1) {
    const section_progress = (time - 90) / 90;
    const num_harmonics = Math.floor(3 + section_progress * 13);  // Build from 3 to 16

    const harmonics = harmonicSeries(ONE, time, num_harmonics);

    leftChannel += harmonics * 0.2;
    rightChannel += harmonics * 0.2;

    // Show the pattern with plucked notes
    const pluck_rate = 2;
    const pluck_phase = (time * pluck_rate / BEAT_DURATION) % 1;
    const pluck_step = Math.floor(time * pluck_rate / BEAT_DURATION) % 8;

    if (pluck_phase < 0.02) {
      const harmonic_num = (pluck_step % 8) + 1;
      const pluck = sine(ONE * harmonic_num, time) * Math.exp(-pluck_phase * 50);
      leftChannel += pluck * 0.18;
      rightChannel += pluck * 0.18;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 2: FOURIER SYNTHESIS (3:00-4:30)
  // Building complexity from simple sines - with build up energy
  // -------------------------------------------------------------------------
  if (section === 2) {
    const section_progress = (time - 180) / 90;

    // Demonstrate Fourier: build a square wave from odd harmonics
    let square_approx = 0;
    const fourier_count = Math.floor(1 + section_progress * 15);
    for (let n = 1; n <= fourier_count; n++) {
      const harmonic = 2 * n - 1;
      square_approx += sine(ONE * 2 * harmonic, time) / harmonic;
    }
    square_approx *= 4 / Math.PI;

    leftChannel += square_approx * 0.15;
    rightChannel += square_approx * 0.15;

    // Build up riser
    const riser_freq = 80 + section_progress * 3000;
    const riser = saw(riser_freq, time) * section_progress * 0.18;
    leftChannel += riser;
    rightChannel += riser;

    // Build up noise
    const noise_val = Math.random() * 2 - 1;
    const build_noise = noise_val * section_progress * section_progress * 0.15;
    leftChannel += build_noise;
    rightChannel += build_noise;

    // Snare roll
    const roll_rate = 4 + section_progress * 56;
    const roll_phase = (time * roll_rate / BEAT_DURATION) % 1;
    if (roll_phase < 0.025) {
      const roll = (Math.random() * 2 - 1) * Math.sin(TWO_PI * 3000 * time);
      const roll_env = Math.exp(-roll_phase * 50);
      leftChannel += roll * roll_env * section_progress * 0.25;
      rightChannel += roll * roll_env * section_progress * 0.25;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 3: DROP 1 - FRACTAL SELF-SIMILARITY (4:30-6:30)
  // Same pattern at every scale - the universe as hologram
  // -------------------------------------------------------------------------
  if (section === 3) {
    // Deep bass line (fractal at low frequencies)
    const bass_step = Math.floor(time / (BEAT_DURATION * 2)) % 4;
    const bass_phase = (time / (BEAT_DURATION * 2)) % 1;
    const bass_pattern = [0, 0, 3, 5];
    const bass_freq = degreeToFreq(40, bass_pattern[bass_step]);  // 40 Hz base - DEEP!

    const bass = deepBass(bass_freq, time, bass_phase);
    leftChannel += bass * 0.42;
    rightChannel += bass * 0.42;

    // Fractal lead (same pattern in mid frequencies)
    const lead_rate = 4;
    const lead_step = Math.floor(time * lead_rate / BEAT_DURATION) % 16;
    const lead_phase = (time * lead_rate / BEAT_DURATION) % 1;
    const lead_pattern = [0, 0, 7, 7, 3, 3, 7, 7, 0, 0, 5, 5, 3, 3, 5, 5];
    const lead_freq = degreeToFreq(220, lead_pattern[lead_step]);

    // Use fractal voice - same pattern at 5 octaves
    const fractal_lead = fractalVoice(lead_freq, time, 5);
    const lead_env = Math.exp(-lead_phase * 4);

    leftChannel += fractal_lead * lead_env * 0.16;
    rightChannel += fractal_lead * lead_env * 0.16;

    // High frequency fractals (same pattern again!)
    const high_pattern_step = lead_step % 4;
    const high_freq = degreeToFreq(1760, [0, 7, 3, 5][high_pattern_step]);
    const high_fractal = sine(high_freq, time) * lead_env * 0.08;
    leftChannel += high_fractal;
    rightChannel += high_fractal;

    // Sub bass pulse (fractal at extreme low)
    if (beat_num === 0 && beat_phase < 0.4) {
      const sub = sine(27.5, time) * Math.exp(-beat_phase * 4);  // 27.5 Hz
      leftChannel += sub * 0.35;
      rightChannel += sub * 0.35;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 4: FEEDBACK LOOPS (6:30-8:00)
  // Self-reference creates infinite beauty
  // -------------------------------------------------------------------------
  if (section === 4) {
    // Rhythmic pulse showing feedback pattern
    const pulse_rate = 8;
    const pulse_phase = (time * pulse_rate / BEAT_DURATION) % 1;
    const pulse_step = Math.floor(time * pulse_rate / BEAT_DURATION) % 8;
    const pulse_pattern = [1, 0, 0, 1, 0, 1, 0, 0];

    if (pulse_pattern[pulse_step] && pulse_phase < 0.03) {
      // Each pulse triggers itself at different delay times (feedback simulation)
      const feedback_freq = degreeToFreq(330, (pulse_step * 3) % 8);
      const pulse = oddHarmonics(feedback_freq, time, 5);
      const pulse_env = Math.exp(-pulse_phase * 30);

      // Simulate feedback by having decaying echoes
      for (let echo = 0; echo < 4; echo++) {
        const echo_phase = pulse_phase - echo * 0.01;
        if (echo_phase > 0) {
          const echo_env = Math.exp(-echo_phase * 30) * Math.pow(0.6, echo);
          leftChannel += pulse * echo_env * 0.15;
          rightChannel += pulse * echo_env * 0.15;
        }
      }
    }

    // Pad showing feedback interference
    const pad_freqs = [110, 165, 220, 330];
    pad_freqs.forEach((freq, i) => {
      const phase_offset = i * Math.PI / 2;
      // Left and right slightly out of phase (feedback interference)
      const left_pad = sine(freq, time, phase_offset);
      const right_pad = sine(freq, time, phase_offset + 0.1);

      leftChannel += left_pad * 0.08;
      rightChannel += right_pad * 0.08;
    });
  }

  // -------------------------------------------------------------------------
  // SECTION 5: GOLDEN SPIRAL BUILD (8:00-9:00)
  // φ ratio everywhere - building to prime drop
  // -------------------------------------------------------------------------
  if (section === 5) {
    const section_progress = (time - 480) / 60;

    // Golden ratio cascade
    const golden = goldenCascade(110, time, 7);
    leftChannel += golden * 0.18;
    rightChannel += golden * 0.18;

    // Arpeggio using golden ratios
    const arp_rate = 16;
    const arp_phase = (time * arp_rate / BEAT_DURATION) % 1;
    const arp_step = Math.floor(time * arp_rate / BEAT_DURATION) % 8;

    if (arp_phase < 0.02) {
      const arp_base = degreeToFreq(660, [0, 3, 7, 12, 7, 3, 5, 10][arp_step]);

      // Notes at golden ratio intervals
      let phi_power = 1;
      for (let i = 0; i < 3; i++) {
        const arp_note = sine(arp_base / phi_power, time);
        const arp_env = Math.exp(-arp_phase * 50);
        leftChannel += arp_note * arp_env * 0.12 / (i + 1);
        rightChannel += arp_note * arp_env * 0.12 / (i + 1);
        phi_power *= φ;
      }
    }

    // Build up riser
    const riser_freq = 100 + section_progress * 4000;
    const riser = saw(riser_freq, time) * section_progress * 0.2;
    leftChannel += riser;
    rightChannel += riser;

    // Build noise and snare roll
    const noise_val = Math.random() * 2 - 1;
    leftChannel += noise_val * section_progress * section_progress * 0.18;
    rightChannel += noise_val * section_progress * section_progress * 0.18;

    const roll_rate = 4 + section_progress * 64;
    const roll_phase = (time * roll_rate / BEAT_DURATION) % 1;
    if (roll_phase < 0.02) {
      const roll = (Math.random() * 2 - 1) * Math.sin(TWO_PI * 3500 * time);
      leftChannel += roll * Math.exp(-roll_phase * 55) * section_progress * 0.3;
      rightChannel += roll * Math.exp(-roll_phase * 55) * section_progress * 0.3;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 6: DROP 2 - PRIME DECOMPOSITION (9:00-11:00)
  // Everything breaks down to primes - the atoms of mathematics
  // -------------------------------------------------------------------------
  if (section === 6) {
    // DEEP bass on primes (frequency ratios are prime numbers)
    const bass_step = Math.floor(time / (BEAT_DURATION * 2)) % 8;
    const bass_phase = (time / (BEAT_DURATION * 2)) % 1;
    const bass_primes = [1, 2, 3, 5, 2, 3, 5, 7];  // Prime intervals
    const bass_freq = 37 * bass_primes[bass_step];  // Base * prime = bass note

    const bass = deepBass(bass_freq, time, bass_phase);
    leftChannel += bass * 0.45;
    rightChannel += bass * 0.45;

    // Prime harmonic lead (only prime harmonics)
    const lead_rate = 4;
    const lead_step = Math.floor(time * lead_rate / BEAT_DURATION) % 8;
    const lead_phase = (time * lead_rate / BEAT_DURATION) % 1;
    const lead_freq = degreeToFreq(165, [0, 3, 7, 10, 7, 5, 3, 0][lead_step]);

    const prime_lead = primeHarmonics(lead_freq, time, [2, 3, 5, 7, 11, 13]);
    const lead_env = Math.exp(-lead_phase * 3.5);

    leftChannel += prime_lead * lead_env * 0.18;
    rightChannel += prime_lead * lead_env * 0.18;

    // Super saw with detuning based on golden ratio
    const saw_freq = degreeToFreq(330, [0, 0, 7, 7, 3, 3, 7, 5][lead_step]);
    const prime_saw = superSaw(saw_freq, time, 7, 0.025);

    leftChannel += prime_saw * lead_env * 0.14;
    rightChannel += prime_saw * lead_env * 0.14;

    // Extra sub on 1
    if (beat_num === 0 && beat_phase < 0.4) {
      const sub = sine(27.5, time) * Math.exp(-beat_phase * 3.5);
      leftChannel += sub * 0.4;
      rightChannel += sub * 0.4;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 7: MANDELBROT COMPLEXITY (11:00-12:30)
  // Infinite detail from simple iteration: Z → Z² + C
  // -------------------------------------------------------------------------
  if (section === 7) {
    // Navigate the Mandelbrot set's parameter space
    const zoom = 1 + (time - 660) / 30;
    const angle = time * 0.05;
    const radius = 0.5 / zoom;

    const cx = -0.5 + Math.cos(angle) * radius;
    const cy = Math.sin(angle) * radius;

    // Compute escape time
    const escape = mandelbrotEscape(cx, cy, 30);

    // Map to rhythm and melody
    const mandel_rate = 4;
    const mandel_step = Math.floor(time * mandel_rate / BEAT_DURATION) % 16;
    const mandel_phase = (time * mandel_rate / BEAT_DURATION) % 1;

    // Use escape time to determine which notes trigger
    if (escape % 3 === 0 || escape > 25) {
      const mandel_degree = (mandel_step + escape) % 14;
      const mandel_freq = degreeToFreq(220, mandel_degree);

      const mandel_note = oddHarmonics(mandel_freq, time, 7);
      const mandel_env = Math.exp(-mandel_phase * 5);

      leftChannel += mandel_note * mandel_env * 0.15;
      rightChannel += mandel_note * mandel_env * 0.15;
    }

    // Pad using escape times as harmonics
    const pad_base = 82.5;
    for (let i = 1; i <= 5; i++) {
      const harmonic = escape % (i * 3) + 1;
      const pad_tone = sine(pad_base * harmonic, time);
      leftChannel += pad_tone * 0.04;
      rightChannel += pad_tone * 0.04;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 8: Y-COMBINATOR RECURSION (12:30-13:30)
  // Functions calling themselves - recursion as structure
  // -------------------------------------------------------------------------
  if (section === 8) {
    // Recursive melody - each note spawns the next
    const recur_rate = 8;
    const recur_step = Math.floor(time * recur_rate / BEAT_DURATION) % 8;
    const recur_phase = (time * recur_rate / BEAT_DURATION) % 1;

    // Fibonacci-like pattern (each note is sum of previous two)
    const fib = [0, 1, 1, 2, 3, 5, 8, 13];
    const recur_degree = fib[recur_step] % 14;
    const recur_freq = degreeToFreq(330, recur_degree);

    // Multiple recursive layers
    for (let depth = 0; depth < 4; depth++) {
      const freq_at_depth = recur_freq * Math.pow(2, depth);
      const amp_at_depth = 1.0 / Math.pow(2, depth);

      const recur_note = sine(freq_at_depth, time);
      const recur_env = Math.exp(-recur_phase * (8 + depth * 4));

      leftChannel += recur_note * recur_env * amp_at_depth * 0.12;
      rightChannel += recur_note * recur_env * amp_at_depth * 0.12;
    }

    // Chaos melody (deterministic recursion)
    const chaos_step = Math.floor(time * 4 / BEAT_DURATION) % 32;
    const chaos_phase = (time * 4 / BEAT_DURATION) % 1;
    const chaos_value = chaosSeq[chaos_step % chaosSeq.length];
    const chaos_degree = Math.floor(chaos_value * 14);
    const chaos_freq = degreeToFreq(440, chaos_degree);

    const chaos_note = harmonicSeries(chaos_freq, time, 8);
    const chaos_env = Math.exp(-chaos_phase * 4);

    leftChannel += chaos_note * chaos_env * 0.14;
    rightChannel += chaos_note * chaos_env * 0.14;
  }

  // -------------------------------------------------------------------------
  // SECTION 9: RETURN TO THE ONE (13:30-15:00)
  // All complexity collapses back to unity
  // -------------------------------------------------------------------------
  if (section === 9) {
    const section_progress = (time - 810) / 90;
    const fade = 1 - section_progress;

    // Return to fundamental
    const one = sine(ONE, time);
    const breath = 0.7 + 0.3 * Math.sin(TWO_PI * time / 10);

    leftChannel = one * fade * breath * 0.25;
    rightChannel = one * fade * breath * 0.25;

    // Harmonics fade out one by one
    const harmonics_remaining = Math.floor(16 * fade);
    if (harmonics_remaining > 1) {
      const harmonics = harmonicSeries(ONE, time, harmonics_remaining);
      leftChannel += harmonics * fade * 0.15;
      rightChannel += harmonics * fade * 0.15;
    }

    // Sparse high bells fading
    const bell_rate = 0.5;
    const bell_phase = (time * bell_rate / BEAT_DURATION) % 1;
    if (bell_phase < 0.02 && Math.random() > section_progress) {
      const bell_freq = degreeToFreq(1760, Math.floor(Math.random() * 8));
      const bell = oddHarmonics(bell_freq, time, 9);
      const bell_env = Math.exp(-bell_phase * 40);
      leftChannel += bell * bell_env * fade * 0.1;
      rightChannel += bell * bell_env * fade * 0.1;
    }
  }

  // -------------------------------------------------------------------------
  // Global Processing
  // -------------------------------------------------------------------------
  leftChannel = Math.tanh(leftChannel * 1.5);
  rightChannel = Math.tanh(rightChannel * 1.5);

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

let lastSection = -1;
const sectionNames = [
  '🌌 THE ONE: Fundamental Unity',
  '🎵 HARMONIC EMANATION: The Overtone Series',
  '🌊 FOURIER SYNTHESIS: Complexity from Simplicity [BUILD UP]',
  '💎 FRACTAL SELF-SIMILARITY: Patterns at Every Scale [DROP 1]',
  '🔄 FEEDBACK LOOPS: Self-Reference Creates Beauty',
  '✨ GOLDEN SPIRAL: φ Everywhere [BUILD UP]',
  '🔢 PRIME DECOMPOSITION: Fundamental Building Blocks [DROP 2]',
  '🌀 MANDELBROT: Infinite Detail from Z² + C',
  '♾️  Y-COMBINATOR: Recursion as Structure',
  '🌌 RETURN TO THE ONE: Unity Restored'
];

const sectionDescriptions = [
  'Pure 55 Hz tone - all emanates from unity...',
  'Natural harmonics emerging: 1:2:3:4:5... The law of vibration',
  'Adding sines to create complexity. Any wave is just sines! Building tension...',
  'Same pattern at every scale - holographic universe! BASS DROPS!',
  'Output becomes input becomes output... Self-computing reality',
  'Golden ratio φ = 1.618... in galaxies, DNA, music. Building to PEAK...',
  'Everything breaks to primes: 2,3,5,7,11,13... Mathematical atoms! PEAK ENERGY!',
  'Iterating Z → Z² + C creates infinite worlds. Exploring fractal space...',
  'Functions calling themselves. Recursion IS existence',
  'All complexity returns to The One. The circle completes...'
];

const writeBuffer = () => {
  if (t >= DURATION) {
    console.log('\n✨ You have experienced the mathematical structure of reality ✨');
    console.log('🎓 Dance floor education complete!\n');
    speaker.end();
    return;
  }

  const buffer = Buffer.alloc(BUFFER_SIZE * CHANNELS * (BIT_DEPTH / 8));

  for (let i = 0; i < BUFFER_SIZE; i++) {
    const currentSection = getSection(t);
    if (currentSection !== lastSection) {
      const minutes = Math.floor(t / 60);
      const seconds = Math.floor(t % 60);
      console.log(`\n[${minutes}:${seconds.toString().padStart(2, '0')}] ${sectionNames[currentSection]}`);
      console.log(`    ${sectionDescriptions[currentSection]}`);
      lastSection = currentSection;
    }

    const sample = cosmicDoof(t);

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
    console.log('\n✨ You have experienced the mathematical structure of reality ✨');
    console.log('🎓 Dance floor education complete!\n');
    speaker.end();
  }
};

// ============================================================================
// Begin the Journey
// ============================================================================

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                      COSMIC DOOF                              ║');
console.log('║         A Dance Floor Education on Universal Structure        ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('🎵 138 BPM Psytrance - 15 Minutes of Mathematical Truth\n');

console.log('📚 CURRICULUM:\n');
console.log('  1. THE ONE (55 Hz) - Unity, the source');
console.log('  2. HARMONIC SERIES - Natural overtones (1:2:3:4:5...)');
console.log('  3. FOURIER SYNTHESIS - Any wave = sum of sines');
console.log('  4. FRACTALS - Self-similarity at every scale 💎');
console.log('  5. FEEDBACK - Self-reference creates infinity 🔄');
console.log('  6. GOLDEN RATIO - φ = 1.618... divine proportion ✨');
console.log('  7. PRIME NUMBERS - Mathematical atoms 🔢');
console.log('  8. MANDELBROT - Z² + C = infinite complexity 🌀');
console.log('  9. Y-COMBINATOR - Recursion as existence ♾️');
console.log('  10. RETURN - Back to The One 🌌\n');

console.log('🔊 Sound Design:');
console.log('  • DEEP sub-bass (27-50 Hz) that shakes reality');
console.log('  • Punchy kicks with sub-harmonic weight');
console.log('  • Mathematical synthesis teaching through sound');
console.log('  • Each section demonstrates a fundamental concept');
console.log('  • Hypnotic, profound, dancefloor-ready\n');

console.log('🎓 "They came to dance."');
console.log('   "They left understanding the structure of the universe."\n');

console.log('💃 Let the education begin... 🕺\n');
console.log('═══════════════════════════════════════════════════════════════\n');

writeBuffer();
