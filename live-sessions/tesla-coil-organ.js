'use strict';

// ============================================================================
// TESLA COIL ORGAN: Seven Minute Electric Symphony
// ============================================================================
// Run with: bun sessions/tesla-coil-organ.js
//
// Every note is high voltage electricity creating sound through electrical
// discharge. Tesla coils create sound through:
// - Arc discharge - literal electrical sparks modulating at audio frequencies
// - Quarter-wave resonance - standing waves (odd harmonics only: 1, 3, 5, 7, 9...)
// - High frequency carrier - modulated by musical notes
// - Electrical crackling - noise from ionization
// - Conjugate fields - E and H fields at 90° creating power flow
// - MASSIVE womping resonance - deep electronic bass drops
//
// Structure:
// 0:00-1:00 - Intro: Establishing the Tesla coil sound
// 1:00-1:30 - Build Up: Tension rising
// 1:30-3:00 - DROP 1: Massive womping bass with arcs
// 3:00-4:00 - Breakdown: Ethereal Tesla harmonics
// 4:00-5:30 - DROP 2: Even more intense, faster wobble
// 5:30-6:30 - Melodic Bridge: Complex polyphony
// 6:30-7:00 - Outro: Fade to sparks
// ============================================================================

const Speaker = require('speaker');

// Constants
const SAMPLE_RATE = 48000;
const CHANNELS = 2;  // Stereo
const BIT_DEPTH = 16;
const BUFFER_SIZE = 4096;
const DURATION = 420;  // 7 minutes (420 seconds)

// Mathematical constants
const TWO_PI = 2 * Math.PI;

// Time keeper
let t = 0;
const dt = 1 / SAMPLE_RATE;

// ============================================================================
// Pure Functions: Tesla Coil Physics as Sound
// ============================================================================

// Sine wave - fundamental oscillation
const sine = (freq, time, phase = 0) =>
  Math.sin(TWO_PI * freq * time + phase);

// Odd harmonics only (quarter-wave resonance)
const oddHarmonics = (fundamental, time, count = 5) => {
  let sum = 0;
  for (let n = 1; n <= count; n++) {
    const harmonic = 2 * n - 1;  // 1, 3, 5, 7, 9...
    const amp = 1.0 / Math.sqrt(harmonic);
    sum += sine(fundamental * harmonic, time) * amp;
  }
  return sum / Math.sqrt(count);
};

// Ring modulation - carrier × modulator (creates sidebands)
const ringMod = (carrier_freq, mod_freq, time) =>
  sine(carrier_freq, time) * sine(mod_freq, time);

// Amplitude modulation - carrier modulated by audio signal
const ampMod = (carrier_freq, modulator, time, depth = 1.0) => {
  const carrier = sine(carrier_freq, time);
  const mod = (1 - depth) + depth * modulator;
  return carrier * mod;
};

// Exponential envelope
const envExp = (phase, rate) =>
  Math.exp(-phase * rate);

// Band-limited noise (for electrical crackle)
const noise = () => Math.random() * 2 - 1;

// Simple bandpass filter simulation (center frequency, Q)
const bandpass = (sample, prevSample, center, time) => {
  const mod = Math.sin(TWO_PI * center * time);
  return sample * mod;
};

// Womping LFO - low frequency oscillator for bass wobble
const wompLFO = (time, rate, shape = 0.5) => {
  // Shape parameter blends between sine (0) and saw (1)
  const sine_lfo = Math.sin(TWO_PI * rate * time);
  const saw_phase = (rate * time) % 1;
  const saw_lfo = 2 * saw_phase - 1;
  const tri_phase = (rate * time) % 1;
  const tri_lfo = 2 * Math.abs(2 * tri_phase - 1) - 1;

  return (1 - shape) * sine_lfo + shape * (0.5 * saw_lfo + 0.5 * tri_lfo);
};

// Advanced wobble with multiple LFO layers
const megaWomp = (time, rate, chaos) => {
  const lfo1 = wompLFO(time, rate, 0.3);
  const lfo2 = wompLFO(time, rate * 1.618, 0.7);  // Golden ratio
  const lfo3 = wompLFO(time, rate * 0.5, 0.5);

  return (lfo1 * 0.5 + lfo2 * 0.3 + lfo3 * 0.2) * (1 + chaos * noise() * 0.1);
};

// ============================================================================
// Musical Structure
// ============================================================================

// Simple pentatonic scale degrees
const scale = [0, 2, 3, 5, 7, 9, 10, 12];  // Minor pentatonic extended

// Convert scale degree to frequency
const degreeToFreq = (base, degree) => {
  const semitones = scale[degree % scale.length] + Math.floor(degree / scale.length) * 12;
  return base * Math.pow(2, semitones / 12);
};

// Get section of the song (0=intro, 1=buildup, 2=drop1, etc)
const getSection = (time) => {
  if (time < 60) return 0;   // Intro
  if (time < 90) return 1;   // Build up
  if (time < 180) return 2;  // Drop 1
  if (time < 240) return 3;  // Breakdown
  if (time < 330) return 4;  // Drop 2
  if (time < 390) return 5;  // Melodic bridge
  return 6;                  // Outro
};

// ============================================================================
// Synthesis Engine: Tesla Coil Organ
// ============================================================================

const teslaVoice = (time) => {
  let leftChannel = 0;
  let rightChannel = 0;

  const section = getSection(time);
  const progress = time / DURATION;

  // -------------------------------------------------------------------------
  // LAYER 1: High-Frequency Carrier (Tesla coil resonance)
  // -------------------------------------------------------------------------
  const carrier_base = 12000 + 3000 * Math.sin(TWO_PI * time / 15);

  // Musical modulation varies by section
  let melody_freq, melody_rate;

  if (section === 0) {
    // Intro - simple melody
    melody_rate = 2;
    const melody_step = Math.floor((time * melody_rate) % 16);
    const melody_degree = [0, 3, 5, 7, 5, 3, 2, 0, 0, 2, 3, 5, 7, 10, 7, 5][melody_step];
    melody_freq = degreeToFreq(220, melody_degree);
  } else if (section === 1) {
    // Build up - increasing intensity
    melody_rate = 3 + (time - 60) / 10;
    const melody_step = Math.floor((time * melody_rate) % 8);
    const melody_degree = [0, 2, 3, 5, 7, 10, 12, 10][melody_step];
    melody_freq = degreeToFreq(220, melody_degree);
  } else if (section === 2 || section === 4) {
    // Drops - aggressive, syncopated
    melody_rate = section === 4 ? 8 : 4;
    const melody_step = Math.floor((time * melody_rate) % 16);
    const pattern = [0, 0, 7, 0, 3, 0, 7, 0, 0, 5, 7, 0, 10, 0, 7, 5];
    melody_freq = degreeToFreq(165, pattern[melody_step]);
  } else {
    // Other sections - flowing
    melody_rate = 2;
    const melody_step = Math.floor((time * melody_rate) % 8);
    melody_freq = degreeToFreq(220, [0, 3, 5, 7, 10, 7, 5, 3][melody_step]);
  }

  const modulator = oddHarmonics(melody_freq, time, 3);
  const tesla_carrier = ampMod(carrier_base, modulator, time, 0.8);

  // Intensity varies by section
  const carrier_intensity = section === 2 || section === 4 ? 0.15 :
                           section === 1 ? 0.1 + (time - 60) / 300 : 0.12;

  leftChannel += tesla_carrier * carrier_intensity;
  rightChannel += tesla_carrier * carrier_intensity;

  // -------------------------------------------------------------------------
  // LAYER 2: Electrical Crackle (ionization noise)
  // -------------------------------------------------------------------------
  const crackle_rate = section === 2 || section === 4 ? 16 :
                       section === 1 ? 8 + (time - 60) / 3 : 8;
  const crackle_phase = (time * crackle_rate) % 1;
  const crackle_trigger = crackle_phase < 0.05;

  if (crackle_trigger) {
    const crackle_noise = noise() * bandpass(1, 0, 6000, time);
    const crackle_env = envExp(crackle_phase * 20, 15);
    const crackle_intensity = section === 2 || section === 4 ? 0.25 : 0.15;
    const crackle = crackle_noise * crackle_env * crackle_intensity;

    leftChannel += crackle;
    rightChannel += crackle;
  }

  // -------------------------------------------------------------------------
  // LAYER 3: Conjugate E/H Fields (stereo at 90°)
  // -------------------------------------------------------------------------
  const field_carrier = 440 + 220 * Math.sin(TWO_PI * time / 8);
  const field_presence = 0.5 + 0.3 * Math.sin(TWO_PI * time / 12);

  const E = Math.cos(TWO_PI * field_carrier * time) * field_presence * 0.08;
  leftChannel += E;

  const H = Math.sin(TWO_PI * field_carrier * time) * field_presence * 0.08;
  rightChannel += H;

  // -------------------------------------------------------------------------
  // LAYER 4: MASSIVE WOMPING BASS (the drops!)
  // -------------------------------------------------------------------------
  if (section >= 2) {
    const womp_fundamental = section === 4 ? 65 : 55;  // Higher in drop 2

    // Wobble rate varies by section
    let womp_rate;
    if (section === 2) womp_rate = 4;      // Drop 1: 4 Hz
    else if (section === 3) womp_rate = 2; // Breakdown: slower
    else if (section === 4) womp_rate = 6; // Drop 2: faster!
    else womp_rate = 3;

    // Use mega womp for drops, simple womp for others
    const chaos_amount = section === 4 ? 0.3 : section === 2 ? 0.2 : 0;
    const lfo = section === 2 || section === 4 ?
                megaWomp(time, womp_rate, chaos_amount) :
                wompLFO(time, womp_rate);

    // More harmonics in the drops
    const harm_count = section === 2 || section === 4 ? 5 : 3;
    const womp_harmonics = [];
    for (let n = 1; n <= harm_count; n += 2) {  // Odd only
      const freq = womp_fundamental * n;
      const amp = 1.0 / n;
      const mod_amp = 0.2 + 0.8 * Math.abs(lfo);
      womp_harmonics.push(sine(freq, time) * amp * mod_amp);
    }

    const womp = womp_harmonics.reduce((sum, h) => sum + h, 0) / harm_count;

    // MASSIVE presence in drops
    const womp_presence = section === 2 || section === 4 ? 0.35 : 0.18;

    leftChannel += womp * womp_presence;
    rightChannel += womp * womp_presence;
  } else if (section === 0) {
    // Intro - gentle womp
    const womp_fundamental = 55;
    const lfo = wompLFO(time, 2);
    const womp_harmonics = [1, 3, 5].map(n => {
      const freq = womp_fundamental * n;
      const amp = 1.0 / n;
      const mod_amp = 0.3 + 0.7 * Math.abs(lfo);
      return sine(freq, time) * amp * mod_amp;
    }).reduce((sum, h) => sum + h, 0) / 3;

    const womp_presence = 0.15;
    leftChannel += womp_harmonics * womp_presence;
    rightChannel += womp_harmonics * womp_presence;
  }

  // -------------------------------------------------------------------------
  // LAYER 5: Sub-Bass Pulse (foundation)
  // -------------------------------------------------------------------------
  if (section !== 1 && section !== 6) {  // Not in buildup or outro
    const pulse_rate = section === 2 || section === 4 ? 4 : 2;
    const pulse_phase = (time * pulse_rate) % 1;
    const pulse_trigger = pulse_phase < 0.3;

    if (pulse_trigger) {
      const sub_freq = 27.5;
      const pulse = sine(sub_freq, time) * envExp(pulse_phase * 3, 4);
      const pulse_presence = section === 2 || section === 4 ? 0.25 : 0.15;

      leftChannel += pulse * pulse_presence;
      rightChannel += pulse * pulse_presence;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 6: Build Up Riser (section 1)
  // -------------------------------------------------------------------------
  if (section === 1) {
    const buildup_progress = (time - 60) / 30;  // 0 to 1 over 30 seconds

    // Rising pitch
    const riser_freq = 100 + buildup_progress * 2000;
    const riser = oddHarmonics(riser_freq, time, 7) * buildup_progress * 0.15;

    leftChannel += riser;
    rightChannel += riser;

    // Increasing noise
    const buildup_noise = noise() * buildup_progress * buildup_progress * 0.1;
    leftChannel += buildup_noise;
    rightChannel += buildup_noise;

    // Snare roll simulation (increasing rate)
    const snare_rate = 4 + buildup_progress * 28;
    const snare_phase = (time * snare_rate) % 1;
    if (snare_phase < 0.05) {
      const snare = noise() * bandpass(1, 0, 3000, time) *
                    envExp(snare_phase * 40, 30) *
                    buildup_progress * 0.2;
      leftChannel += snare;
      rightChannel += snare;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 7: Chord Progressions
  // -------------------------------------------------------------------------
  if (section === 0 || section === 3 || section === 5) {
    const chord_rate = section === 5 ? 2 : 1.5;
    const chord_step = Math.floor((time * chord_rate) % 8);
    const chord_roots = [0, 5, 3, 7, 0, 3, 5, 2];
    const chord_root = chord_roots[chord_step];

    const chord_notes = [0, 2, 4].map(offset => {
      const degree = chord_root + offset;
      const freq = degreeToFreq(165, degree);
      return oddHarmonics(freq, time, 4);
    });

    const chord = chord_notes.reduce((sum, note) => sum + note, 0) / 3;
    const chord_presence = section === 5 ? 0.15 : 0.1;

    leftChannel += chord * chord_presence;
    rightChannel += chord * chord_presence;
  }

  // -------------------------------------------------------------------------
  // LAYER 8: Arpeggios (drops and melodic sections)
  // -------------------------------------------------------------------------
  if (section === 2 || section === 4 || section === 5) {
    const arp_rate = section === 4 ? 16 : section === 5 ? 6 : 8;
    const arp_step = Math.floor((time * arp_rate) % 8);
    const arp_pattern = section === 5 ?
                       [0, 3, 7, 10, 12, 10, 7, 3] :
                       [0, 3, 7, 10, 7, 5, 3, 0];
    const arp_degree = arp_pattern[arp_step];
    const arp_freq = degreeToFreq(330, arp_degree);
    const arp_phase = (time * arp_rate) % 1;

    const arp_carrier = section === 4 ? 10000 : 8000;
    const arp = ringMod(arp_carrier, arp_freq, time) * envExp(arp_phase, 6);
    const arp_presence = section === 4 ? 0.2 : 0.15;

    leftChannel += arp * arp_presence;
    rightChannel += arp * arp_presence;
  }

  // -------------------------------------------------------------------------
  // LAYER 9: Breakdown Atmosphere (section 3)
  // -------------------------------------------------------------------------
  if (section === 3) {
    const breakdown_progress = (time - 180) / 60;

    // Ethereal high pads
    const pad_voices = [1760, 1980, 2217, 2489];  // High harmonics
    pad_voices.forEach((freq, i) => {
      const phase_offset = i * Math.PI / 2;
      const pad = sine(freq, time, phase_offset) *
                  (0.5 + 0.5 * Math.sin(TWO_PI * time / (20 + i * 5))) *
                  0.04;

      if (i % 2 === 0) leftChannel += pad;
      else rightChannel += pad;
    });

    // Sparse bell-like hits
    const bell_rate = 0.5;
    const bell_phase = (time * bell_rate) % 1;
    if (bell_phase < 0.02) {
      const bell_freq = degreeToFreq(880, Math.floor(breakdown_progress * 7));
      const bell = oddHarmonics(bell_freq, time, 9) *
                   envExp(bell_phase * 50, 8) * 0.12;
      leftChannel += bell;
      rightChannel += bell;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 10: Melodic Bridge Polyphony (section 5)
  // -------------------------------------------------------------------------
  if (section === 5) {
    const voices = [
      { base: 220, rate: 4, offset: 0 },
      { base: 330, rate: 3, offset: 0.333 },
      { base: 165, rate: 2, offset: 0.666 }
    ];

    voices.forEach(voice => {
      const step = Math.floor(((time + voice.offset) * voice.rate) % 8);
      const degree = [0, 2, 3, 5, 7, 5, 3, 2][step];
      const freq = degreeToFreq(voice.base, degree);
      const phase = ((time + voice.offset) * voice.rate) % 1;

      const note = oddHarmonics(freq, time, 5) * envExp(phase, 4);

      leftChannel += note * 0.08;
      rightChannel += note * 0.08;
    });
  }

  // -------------------------------------------------------------------------
  // LAYER 11: Kick Drum (drops only)
  // -------------------------------------------------------------------------
  if (section === 2 || section === 4) {
    const kick_rate = 4;  // 4 kicks per second
    const kick_phase = (time * kick_rate) % 1;

    if (kick_phase < 0.15) {
      // Pitch envelope for kick (starts high, drops fast)
      const kick_freq = 150 * Math.exp(-kick_phase * 30);
      const kick = sine(kick_freq, time) *
                   envExp(kick_phase * 10, 12) * 0.3;

      leftChannel += kick;
      rightChannel += kick;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 12: Hi-hat/Percussion (drops and melodic)
  // -------------------------------------------------------------------------
  if (section === 2 || section === 4 || section === 5) {
    const hat_rate = section === 4 ? 16 : 8;
    const hat_phase = (time * hat_rate) % 1;
    const hat_pattern = section === 4 ?
                       [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1] :
                       [1, 0, 1, 0, 1, 0, 1, 0];
    const hat_step = Math.floor((time * hat_rate) % hat_pattern.length);

    if (hat_pattern[hat_step] && hat_phase < 0.02) {
      const hat = noise() * bandpass(1, 0, 8000, time) *
                  envExp(hat_phase * 80, 40) * 0.1;
      leftChannel += hat;
      rightChannel += hat;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 13: Outro Fade (section 6)
  // -------------------------------------------------------------------------
  if (section === 6) {
    const outro_progress = (time - 390) / 30;
    const fade = 1 - outro_progress;

    // Just sparse crackles and high carrier
    leftChannel *= fade;
    rightChannel *= fade;
  }

  // -------------------------------------------------------------------------
  // Global limiting (soft clip to prevent distortion)
  // -------------------------------------------------------------------------
  leftChannel = Math.tanh(leftChannel * 1.4);
  rightChannel = Math.tanh(rightChannel * 1.4);

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

// Track progress
let lastSection = -1;
const sectionNames = [
  'INTRO: Establishing Tesla Sound',
  'BUILD UP: Tension Rising',
  'DROP 1: MASSIVE WOMP',
  'BREAKDOWN: Ethereal Harmonics',
  'DROP 2: ULTRA MASSIVE',
  'MELODIC BRIDGE: Complex Polyphony',
  'OUTRO: Fading to Sparks'
];

// Generate and write buffers
const writeBuffer = () => {
  if (t >= DURATION) {
    console.log('\n✨ Tesla Coil Organ complete!\n');
    speaker.end();
    return;
  }

  const buffer = Buffer.alloc(BUFFER_SIZE * CHANNELS * (BIT_DEPTH / 8));

  for (let i = 0; i < BUFFER_SIZE; i++) {
    // Track section changes
    const currentSection = getSection(t);
    if (currentSection !== lastSection) {
      const minutes = Math.floor(t / 60);
      const seconds = Math.floor(t % 60);
      console.log(`\n[${minutes}:${seconds.toString().padStart(2, '0')}] ${sectionNames[currentSection]}`);
      lastSection = currentSection;
    }

    // Synthesize stereo sample
    const sample = teslaVoice(t);

    // Convert [-1, 1] to 16-bit integers
    const leftInt = Math.max(-32768, Math.min(32767, Math.floor(sample.left * 32767)));
    const rightInt = Math.max(-32768, Math.min(32767, Math.floor(sample.right * 32767)));

    // Write to buffer (interleaved stereo)
    const offset = i * CHANNELS * 2;
    buffer.writeInt16LE(leftInt, offset);
    buffer.writeInt16LE(rightInt, offset + 2);

    t += dt;

    if (t >= DURATION) break;
  }

  // Write buffer and schedule next one
  const canContinue = speaker.write(buffer);

  if (canContinue && t < DURATION) {
    setImmediate(writeBuffer);
  } else if (t < DURATION) {
    speaker.once('drain', writeBuffer);
  } else {
    console.log('\n✨ Tesla Coil Organ complete!\n');
    speaker.end();
  }
};

// ============================================================================
// Start the stream
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║              TESLA COIL ORGAN                              ║');
console.log('║         Seven Minute Electric Symphony                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('⚡ Pure JavaScript + Speaker');
console.log('📊 48000 samples/second');
console.log('⏱  Duration: 7 minutes (420 seconds)\n');

console.log('🔊 Sound Design:');
console.log('  • High-frequency carrier (12-15 kHz) - Tesla coil resonance');
console.log('  • Quarter-wave modes (odd harmonics only)');
console.log('  • Amplitude modulation by musical notes');
console.log('  • Electrical crackle and arc discharge');
console.log('  • Stereo conjugate E/H fields (90° phase)');
console.log('  • MASSIVE womping bass (multi-layer LFO)');
console.log('  • Sub-bass kicks and percussion');
console.log('  • Ring modulation arpeggios\n');

console.log('🎵 Structure:');
console.log('  • 0:00-1:00  Intro: Establishing the sound');
console.log('  • 1:00-1:30  Build Up: Rising tension');
console.log('  • 1:30-3:00  DROP 1: Massive womping bass 🔥');
console.log('  • 3:00-4:00  Breakdown: Ethereal Tesla harmonics');
console.log('  • 4:00-5:30  DROP 2: Ultra massive (6 Hz womp!) 💥');
console.log('  • 5:30-6:30  Melodic Bridge: Complex polyphony');
console.log('  • 6:30-7:00  Outro: Fade to sparks\n');

console.log('⚡ Physics Modeled:');
console.log('  • Arc discharge - sparks at audio frequencies');
console.log('  • Quarter-wave resonance - standing waves');
console.log('  • Carrier modulation - high frequency base');
console.log('  • Ionization - electrical noise');
console.log('  • Poynting vector - E × H field interaction\n');

console.log('🎧 Playing... prepare for the DROP! 🔥💥\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Begin synthesis
writeBuffer();
