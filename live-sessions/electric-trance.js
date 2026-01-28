'use strict';

// ============================================================================
// ELECTRIC TRANCE: Tesla Physics Meets the Dance Floor
// ============================================================================
// Run with: bun sessions/electric-trance.js
//
// A 10-minute journey designed to get everyone dancing and ENTRANCED.
// Fusing everything we've learned:
// - Tesla quarter-wave resonance (odd harmonics)
// - Golden ratio frequency relationships
// - Chaos theory melodies
// - Conjugate E/H fields (stereo magic)
// - Poynting vector (energy flow)
// - DEEP sub-bass that you FEEL (30-50 Hz)
// - Punchy mid-bass (60-120 Hz)
// - Hypnotic repetition with evolving complexity
//
// Structure: 130 BPM trance
// 0:00-1:30   Intro: Establishing the vibe
// 1:30-2:00   Build 1: Rising energy
// 2:00-4:00   Drop 1: First wave of euphoria
// 4:00-4:30   Break: Ethereal moment
// 4:30-5:00   Build 2: Maximum tension
// 5:00-7:30   Drop 2: PEAK - full power
// 7:30-8:30   Melodic section: Transcendence
// 8:30-10:00  Outro: Gentle landing
// ============================================================================

const Speaker = require('speaker');

// Constants
const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BIT_DEPTH = 16;
const BUFFER_SIZE = 4096;
const DURATION = 600;  // 10 minutes
const BPM = 130;
const BEAT_DURATION = 60 / BPM;

// Mathematical constants
const TWO_PI = 2 * Math.PI;
const φ = 1.618033988749;  // Golden ratio

// Time keeper
let t = 0;
const dt = 1 / SAMPLE_RATE;

// ============================================================================
// Pure Functions: Club-Ready Synthesis
// ============================================================================

const sine = (freq, time, phase = 0) =>
  Math.sin(TWO_PI * freq * time + phase);

// Odd harmonics only (Tesla quarter-wave)
const oddHarmonics = (fundamental, time, count = 5) => {
  let sum = 0;
  for (let n = 1; n <= count; n++) {
    const harmonic = 2 * n - 1;
    const amp = 1.0 / Math.sqrt(harmonic);
    sum += sine(fundamental * harmonic, time) * amp;
  }
  return sum / Math.sqrt(count);
};

// PROPER kick drum with actual low-end punch
const kickDrum = (phase) => {
  // Pitch envelope: starts at 150 Hz, drops to 40 Hz
  const pitch = 40 + 110 * Math.exp(-phase * 35);

  // Body envelope (longer)
  const body_env = Math.exp(-phase * 8);

  // Click envelope (shorter, for attack)
  const click_env = Math.exp(-phase * 50);

  // Body sine wave (the thump)
  const body = Math.sin(TWO_PI * pitch * phase) * body_env;

  // Click/attack (adds punch)
  const click = Math.sin(TWO_PI * pitch * 4 * phase) * click_env * 0.3;

  // Sub harmonic (the DEEP feeling)
  const sub = Math.sin(TWO_PI * pitch * 0.5 * phase) * body_env * 0.6;

  return (body + click + sub) * 0.9;
};

// PROPER bass line - deep and punchy
const deepBass = (freq, time, phase) => {
  // Fundamental (40-80 Hz range for deep club bass)
  const fundamental = sine(freq, time) * 0.7;

  // First harmonic for punch (audible range)
  const harmonic1 = sine(freq * 2, time) * 0.25;

  // Third harmonic for character
  const harmonic3 = sine(freq * 3, time) * 0.15;

  // Envelope
  const env = Math.exp(-phase * 4) * 0.5 + 0.5;

  return (fundamental + harmonic1 + harmonic3) * env;
};

// Womping bass with DEEP frequencies
const clubWomp = (freq, time, lfo_rate) => {
  // LFO for wobble
  const lfo = Math.sin(TWO_PI * lfo_rate * time);
  const lfo_amount = 0.3 + 0.7 * Math.abs(lfo);

  // Multiple octaves for fullness
  const sub = sine(freq * 0.5, time) * 0.5;  // Sub bass
  const fundamental = sine(freq, time) * 0.8;
  const harmonic = sine(freq * 2, time) * 0.3;

  return (sub + fundamental + harmonic) * lfo_amount;
};

// Saw wave (classic trance lead)
const saw = (freq, time) => {
  const phase = (freq * time) % 1;
  return 2 * phase - 1;
};

// Super saw (multiple detuned saws for thickness)
const superSaw = (freq, time, voices = 5, detune = 0.05) => {
  let sum = 0;
  for (let i = 0; i < voices; i++) {
    const offset = (i - voices / 2) * detune;
    sum += saw(freq * (1 + offset), time);
  }
  return sum / voices;
};

// Pluck envelope
const pluck = (phase, decay = 6) =>
  Math.exp(-phase * decay);

// Get section
const getSection = (time) => {
  if (time < 90) return 0;    // Intro
  if (time < 120) return 1;   // Build 1
  if (time < 240) return 2;   // Drop 1
  if (time < 270) return 3;   // Break
  if (time < 300) return 4;   // Build 2
  if (time < 450) return 5;   // Drop 2 (PEAK)
  if (time < 510) return 6;   // Melodic
  return 7;                   // Outro
};

// Chaos sequence for melodies (logistic map)
const generateChaos = (length, x0 = 0.1, r = 3.9) => {
  const seq = [];
  let x = x0;
  for (let i = 0; i < length; i++) {
    x = r * x * (1 - x);
    seq.push(x);
  }
  return seq;
};

const chaosSeq = generateChaos(256);

// Scale degrees (minor scale for trance vibe)
const scale = [0, 2, 3, 5, 7, 8, 10, 12];

const degreeToFreq = (base, degree) => {
  const semitones = scale[degree % scale.length] + Math.floor(degree / scale.length) * 12;
  return base * Math.pow(2, semitones / 12);
};

// ============================================================================
// Main Synthesis Engine
// ============================================================================

const tranceVoice = (time) => {
  let leftChannel = 0;
  let rightChannel = 0;

  const section = getSection(time);
  const beat_phase = (time / BEAT_DURATION) % 1;
  const bar_phase = (time / (BEAT_DURATION * 4)) % 1;
  const beat_num = Math.floor(time / BEAT_DURATION) % 4;

  // -------------------------------------------------------------------------
  // LAYER 1: KICK DRUM (the heartbeat)
  // -------------------------------------------------------------------------
  if (section >= 1 && section !== 7) {  // All sections except intro and outro
    const kick_phase = beat_phase;

    if (kick_phase < 0.5) {  // Kick on every beat
      const kick = kickDrum(kick_phase * 2);
      leftChannel += kick * 0.5;
      rightChannel += kick * 0.5;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 2: DEEP SUB BASS (the foundation - you FEEL this)
  // -------------------------------------------------------------------------
  if (section >= 2 && section !== 3 && section !== 7) {
    // Bass plays on 1 and 3 of each bar, longer notes
    const bass_step = Math.floor(time / (BEAT_DURATION * 2)) % 4;
    const bass_phase = (time / (BEAT_DURATION * 2)) % 1;

    // Simple but effective bassline
    const bass_pattern = [0, 0, 3, 5];  // Root, root, minor 3rd, 5th
    const bass_degree = bass_pattern[bass_step];
    const bass_freq = degreeToFreq(section === 5 ? 44 : 49, bass_degree);  // 44/49 Hz base (DEEP!)

    const bass = deepBass(bass_freq, time, bass_phase);

    const bass_presence = section === 5 ? 0.45 : 0.35;  // Louder in drop 2

    leftChannel += bass * bass_presence;
    rightChannel += bass * bass_presence;
  }

  // -------------------------------------------------------------------------
  // LAYER 3: WOMPING MID BASS (the wobble you hear)
  // -------------------------------------------------------------------------
  if (section === 2 || section === 5) {
    const womp_rate = section === 5 ? 4 : 2;  // Faster in drop 2
    const womp_step = Math.floor(time / BEAT_DURATION) % 8;
    const womp_pattern = [0, 0, 3, 3, 5, 5, 7, 7];
    const womp_degree = womp_pattern[womp_step];
    const womp_freq = degreeToFreq(section === 5 ? 65 : 55, womp_degree);

    const womp = clubWomp(womp_freq, time, womp_rate);

    leftChannel += womp * 0.3;
    rightChannel += womp * 0.3;
  }

  // -------------------------------------------------------------------------
  // LAYER 4: Hi-Hats (the groove)
  // -------------------------------------------------------------------------
  if (section >= 1 && section !== 7) {
    const hat_rate = 8;  // 8th notes
    const hat_phase = (time * hat_rate / BEAT_DURATION) % 1;
    const hat_step = Math.floor(time * hat_rate / BEAT_DURATION) % 8;

    // Classic house pattern
    const hat_pattern = [0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.9, 0.5];
    const hat_accent = hat_pattern[hat_step];

    if (hat_phase < 0.05) {
      const noise_val = Math.random() * 2 - 1;
      // High-pass noise simulation
      const hat = noise_val * Math.sin(TWO_PI * 8000 * time);
      const env = Math.exp(-hat_phase * 60);

      leftChannel += hat * env * hat_accent * 0.15;
      rightChannel += hat * env * hat_accent * 0.15;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 5: Clap/Snare (on 2 and 4)
  // -------------------------------------------------------------------------
  if (section >= 2 && section !== 3 && section !== 7) {
    if ((beat_num === 1 || beat_num === 3) && beat_phase < 0.08) {
      const noise_val = Math.random() * 2 - 1;
      const clap = noise_val * Math.sin(TWO_PI * 2000 * time);
      const env = Math.exp(-beat_phase * 25);

      leftChannel += clap * env * 0.25;
      rightChannel += clap * env * 0.25;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 6: Tesla Carrier (high frequency ethereal layer)
  // -------------------------------------------------------------------------
  if (section === 0 || section === 3 || section === 6 || section === 7) {
    // Present in intro, break, melodic, and outro
    const carrier_freq = 8000 + 2000 * Math.sin(TWO_PI * time / 20);
    const carrier_mod_rate = 4;
    const carrier_step = Math.floor(time * carrier_mod_rate / BEAT_DURATION) % 8;
    const carrier_degree = [0, 2, 3, 5, 7, 5, 3, 2][carrier_step];
    const carrier_mod_freq = degreeToFreq(220, carrier_degree);

    const modulator = oddHarmonics(carrier_mod_freq, time, 3) * 0.5 + 0.5;
    const carrier = sine(carrier_freq, time) * modulator;

    const carrier_presence = section === 6 ? 0.12 : 0.08;

    leftChannel += carrier * carrier_presence;
    rightChannel += carrier * carrier_presence;
  }

  // -------------------------------------------------------------------------
  // LAYER 7: Trance Lead (super saw)
  // -------------------------------------------------------------------------
  if (section === 2 || section === 5 || section === 6) {
    const lead_rate = section === 6 ? 2 : 4;  // Slower in melodic section
    const lead_step = Math.floor(time * lead_rate / BEAT_DURATION) % 16;
    const lead_phase = (time * lead_rate / BEAT_DURATION) % 1;

    let lead_pattern;
    if (section === 6) {
      // More melodic
      lead_pattern = [0, 3, 5, 7, 10, 7, 5, 3, 0, 2, 3, 5, 7, 10, 12, 10];
    } else {
      // More driving
      lead_pattern = [0, 0, 7, 7, 3, 3, 7, 7, 0, 0, 5, 5, 3, 3, 5, 5];
    }

    const lead_degree = lead_pattern[lead_step];
    const lead_freq = degreeToFreq(section === 6 ? 440 : 330, lead_degree);

    const lead = superSaw(lead_freq, time, 7, 0.02);
    const env = pluck(lead_phase, section === 6 ? 2 : 3);

    // Stereo width
    const left_detune = superSaw(lead_freq * 0.995, time, 5, 0.02);
    const right_detune = superSaw(lead_freq * 1.005, time, 5, 0.02);

    const lead_presence = section === 5 ? 0.15 : section === 6 ? 0.18 : 0.12;

    leftChannel += (lead * 0.7 + left_detune * 0.3) * env * lead_presence;
    rightChannel += (lead * 0.7 + right_detune * 0.3) * env * lead_presence;
  }

  // -------------------------------------------------------------------------
  // LAYER 8: Arpeggio (golden ratio cascade)
  // -------------------------------------------------------------------------
  if (section === 2 || section === 5 || section === 6) {
    const arp_rate = 16;  // 16th notes
    const arp_phase = (time * arp_rate / BEAT_DURATION) % 1;
    const arp_step = Math.floor(time * arp_rate / BEAT_DURATION) % 8;

    const arp_pattern = [0, 3, 7, 12, 7, 3, 5, 10];
    const arp_degree = arp_pattern[arp_step];
    const arp_base = degreeToFreq(880, arp_degree);

    // Golden ratio frequencies
    let arp = 0;
    let phi_power = 1;
    for (let i = 0; i < 3; i++) {
      arp += sine(arp_base / phi_power, time) / (i + 1);
      phi_power *= φ;
    }
    arp /= 3;

    const env = pluck(arp_phase, 12);

    const arp_presence = section === 6 ? 0.15 : 0.1;

    leftChannel += arp * env * arp_presence;
    rightChannel += arp * env * arp_presence;
  }

  // -------------------------------------------------------------------------
  // LAYER 9: Pad (conjugate E/H fields for stereo width)
  // -------------------------------------------------------------------------
  if (section >= 1 && section !== 7) {
    const pad_root = section === 5 ? 110 : 130;
    const pad_frequencies = [1, 1.5, 2, 3].map(mult => pad_root * mult);

    pad_frequencies.forEach((freq, i) => {
      // E field (left, cosine)
      const E = Math.cos(TWO_PI * freq * time + i * Math.PI / 4);

      // H field (right, sine - 90° shift)
      const H = Math.sin(TWO_PI * freq * time + i * Math.PI / 4);

      const pad_presence = section === 3 ? 0.1 : 0.06;

      leftChannel += E * pad_presence / 4;
      rightChannel += H * pad_presence / 4;
    });
  }

  // -------------------------------------------------------------------------
  // LAYER 10: Chaos Melody (break and melodic sections)
  // -------------------------------------------------------------------------
  if (section === 3 || section === 6) {
    const chaos_rate = 4;
    const chaos_step = Math.floor(time * chaos_rate / BEAT_DURATION) % 16;
    const chaos_phase = (time * chaos_rate / BEAT_DURATION) % 1;

    const chaos_value = chaosSeq[chaos_step % chaosSeq.length];
    const chaos_degree = Math.floor(chaos_value * 14);
    const chaos_freq = degreeToFreq(section === 3 ? 660 : 440, chaos_degree);

    const chaos_note = oddHarmonics(chaos_freq, time, 5);
    const env = pluck(chaos_phase, 5);

    leftChannel += chaos_note * env * 0.12;
    rightChannel += chaos_note * env * 0.12;
  }

  // -------------------------------------------------------------------------
  // LAYER 11: Build Up Riser
  // -------------------------------------------------------------------------
  if (section === 1 || section === 4) {
    const build_start = section === 1 ? 90 : 270;
    const build_progress = (time - build_start) / 30;

    // Rising pitch
    const riser_freq = 100 + build_progress * 3000;
    const riser = saw(riser_freq, time) * build_progress * 0.2;

    leftChannel += riser;
    rightChannel += riser;

    // Increasing noise
    const noise_val = Math.random() * 2 - 1;
    const build_noise = noise_val * build_progress * build_progress * 0.15;

    leftChannel += build_noise;
    rightChannel += build_noise;

    // Snare roll
    const roll_rate = 4 + build_progress * 60;
    const roll_phase = (time * roll_rate / BEAT_DURATION) % 1;

    if (roll_phase < 0.03) {
      const roll_noise = (Math.random() * 2 - 1) * Math.sin(TWO_PI * 3000 * time);
      const roll_env = Math.exp(-roll_phase * 40);

      leftChannel += roll_noise * roll_env * build_progress * 0.3;
      rightChannel += roll_noise * roll_env * build_progress * 0.3;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 12: Sub Bass Pulse (extra low end in drops)
  // -------------------------------------------------------------------------
  if (section === 5) {
    // Extra sub on beat 1 of every bar
    if (beat_num === 0 && beat_phase < 0.4) {
      const sub = sine(30, time) * Math.exp(-beat_phase * 5);  // 30 Hz - DEEP!

      leftChannel += sub * 0.4;
      rightChannel += sub * 0.4;
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 13: Outro Fade
  // -------------------------------------------------------------------------
  if (section === 7) {
    const outro_progress = (time - 510) / 90;
    const fade = 1 - outro_progress;

    leftChannel *= fade;
    rightChannel *= fade;
  }

  // -------------------------------------------------------------------------
  // Global Processing
  // -------------------------------------------------------------------------

  // Soft clipper (acts like analog saturation)
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
  'INTRO: Setting the Vibe',
  'BUILD 1: Energy Rising',
  'DROP 1: First Wave of Euphoria 🌊',
  'BREAK: Ethereal Moment',
  'BUILD 2: Maximum Tension 🔥',
  'DROP 2: PEAK - Full Power 💥',
  'MELODIC: Transcendence ✨',
  'OUTRO: Gentle Landing'
];

const writeBuffer = () => {
  if (t >= DURATION) {
    console.log('\n✨ Journey complete - you are now ENTRANCED! ✨\n');
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
      lastSection = currentSection;
    }

    const sample = tranceVoice(t);

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
    console.log('\n✨ Journey complete - you are now ENTRANCED! ✨\n');
    speaker.end();
  }
};

// ============================================================================
// Start the Journey
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                  ELECTRIC TRANCE                           ║');
console.log('║         Tesla Physics Meets the Dance Floor                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('🎵 130 BPM - 10 Minutes of Pure Energy\n');

console.log('🔊 Sound Design:');
console.log('  • DEEP sub-bass (30-50 Hz) - you FEEL this');
console.log('  • Punchy mid-bass (60-120 Hz) - the groove');
console.log('  • Tesla carrier (8-10 kHz) - ethereal highs');
console.log('  • Super saw leads - thick and wide');
console.log('  • Golden ratio arpeggios (φ cascade)');
console.log('  • Conjugate E/H pads (stereo magic)');
console.log('  • Chaos theory melodies (logistic map)');
console.log('  • Quarter-wave harmonics (odd only)\n');

console.log('🎵 Structure:');
console.log('  • 0:00-1:30   Intro: Setting the vibe');
console.log('  • 1:30-2:00   Build 1: Rising energy');
console.log('  • 2:00-4:00   Drop 1: First wave 🌊');
console.log('  • 4:00-4:30   Break: Breathe');
console.log('  • 4:30-5:00   Build 2: Maximum tension 🔥');
console.log('  • 5:00-7:30   Drop 2: PEAK POWER 💥');
console.log('  • 7:30-8:30   Melodic: Transcendence ✨');
console.log('  • 8:30-10:00  Outro: Gentle landing\n');

console.log('💃 Ready to get ENTRANCED? Let\'s GO! 🕺\n');
console.log('═══════════════════════════════════════════════════════════\n');

writeBuffer();
