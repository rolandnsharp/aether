// live-session.js - Live Coding Interface (Kanon Engine)
// ============================================================================
// LIVE CODING: Edit this file while audio is playing for instant updates!
// ============================================================================
// Hot-reload compatible: Uses globalThis.KANON_STATE for phase continuity
// ============================================================================

import { clear } from './src/aether.js';

clear();

// ============================================================================
// EXAMPLE: Virtual Analog Drone (dt-Style Subtractive Synth)
// ============================================================================
// A complete synth voice that simulates an analog drone. It uses the dt-style
// for its components: two detuned sawtooth oscillators, a low-pass filter,
// and a pulsing AD envelope, creating a thick, evolving, and classic sound.

// kanon('virtual-analog-drone', (mem, idx) => {
//   // --- SURGERY PARAMETERS (the "knobs" of the synth) ---
//   const params = {
//     osc1_dt: 0.0053,    // Pitch of osc 1 (higher value = higher pitch)
//     osc2_detune: 1.004, // Detuning factor for osc 2 (e.g., 1.005 is slightly sharp)
//     cutoff: 0.1,        // Filter cutoff (0.0 to 1.0, lower is darker)
//     resonance: 0.9,     // Filter resonance (not used in this simple filter)
//     env_attack: 0.00001, // Envelope attack speed (how fast it swells)
//     env_decay: 0.00012,  // Envelope decay speed (how fast it fades)
//     pulse_dt: 0.00011   // Speed of the pulsing LFO that re-triggers the envelope
//   };

//   // State memory layout
//   const STATE = {
//     OSC1_PHASE: idx,
//     OSC2_PHASE: idx + 1,
//     FILTER_Z1:  idx + 2, // Filter's internal memory (previous sample)
//     ENV_LEVEL:  idx + 3, // Current level of the amplitude envelope
//     ENV_GATE:   idx + 4, // 1 for attack phase, 0 for decay phase
//     PULSE_PHASE:idx + 5, // Phase of the re-triggering LFO
//   };

//   // Pre-calculate the second oscillator's pitch
//   const osc2_dt = params.osc1_dt * params.osc2_detune;

//   return {
//     update: () => {
//       // 1. Update LFO and Envelope Gate
//       mem[STATE.PULSE_PHASE] = (mem[STATE.PULSE_PHASE] + params.pulse_dt) % 1.0;
//       // When the pulse LFO crosses zero, trigger the envelope's attack phase
//       if (mem[STATE.PULSE_PHASE] < params.pulse_dt) {
//         mem[STATE.ENV_GATE] = 1.0; // Attack
//       }

//       // 2. Update Amplitude Envelope (AD)
//       let env_level = mem[STATE.ENV_LEVEL];
//       if (mem[STATE.ENV_GATE] === 1.0) { // If in attack phase...
//         env_level += params.env_attack;
//         if (env_level >= 1.0) { // Once it reaches the top...
//           env_level = 1.0;
//           mem[STATE.ENV_GATE] = 0.0; // ...switch to decay phase
//         }
//       } else { // If in decay phase...
//         env_level -= params.env_decay;
//         if (env_level <= 0.0) {
//           env_level = 0.0;
//         }
//       }
//       mem[STATE.ENV_LEVEL] = env_level;

//       // 3. Update Oscillators (Sawtooth)
//       mem[STATE.OSC1_PHASE] = (mem[STATE.OSC1_PHASE] + params.osc1_dt) % 1.0;
//       mem[STATE.OSC2_PHASE] = (mem[STATE.OSC2_PHASE] + osc2_dt) % 1.0;
//       const osc1_out = mem[STATE.OSC1_PHASE] * 2.0 - 1.0;
//       const osc2_out = mem[STATE.OSC2_PHASE] * 2.0 - 1.0;
//       const mixed_oscs = (osc1_out + osc2_out) * 0.5;

//       // 4. Update Filter (Simple one-pole low-pass)
//       let filter_z1 = mem[STATE.FILTER_Z1] || 0;
//       const filtered_sound = (mixed_oscs * params.cutoff) + (filter_z1 * (1.0 - params.cutoff));
//       mem[STATE.FILTER_Z1] = filtered_sound;

//       // 5. Apply Envelope and Emit
//       const output = filtered_sound * env_level * 0.5; // Final gain stage
//       return [output];
//     }
//   };
// });

// ============================================================================
// MANUAL API TEST - Basic sine for testing hot-reload
// ============================================================================

  // kanon('basic-sines3', (state, idx, sampleRate) => {
  //   // GC OPTIMIZATION: Create the output vector once and reuse it.
  //   const reusableVector = new Float64Array(1);
  //   const freq = 444;
  //   const phaseIncrement = freq / sampleRate;

  //   console.log(`[REGISTER] freq=${freq}Hz, idx=${idx}`);

  //   return {
  //     update: () => {
  //       state[idx] = ((state[idx] || 0) + phaseIncrement) % 1.0;

  //       // Log occasionally
  //       if (Math.random() < 0.0001) {
  //         console.log(`[UPDATE] phase=${state[idx].toFixed(3)}`);
  //       }

  //       reusableVector[0] = Math.sin(state[idx] * 2 * Math.PI) * 0.3;
  //       return reusableVector;
  //     }
  //   };
  // });



// ============================================================================
// EXAMPLE 1: Breathing Sine (Simple amplitude modulation)
// ============================================================================
// A pure sine wave whose volume breathes with an LFO

// kanon('breathing-sine', (state, idx, sampleRate) => {
//   const carrierFreq = 220.0; // A3 note
//   const lfoFreq = 0.5; // Breathe twice per second
//   const lfoDepth = 0.7; // How much the volume changes

//   // Pre-compute phase increments
//   const carrierPhaseIncrement = carrierFreq / sampleRate;
//   const lfoPhaseIncrement = lfoFreq / sampleRate;

//   return {
//     update: () => {
//       // Carrier oscillator (state slot idx)
//       let carrierPhase = state[idx];
//       carrierPhase = (carrierPhase + carrierPhaseIncrement) % 1.0;
//       state[idx] = carrierPhase;
//       const carrier = Math.sin(carrierPhase * 2 * Math.PI);

//       // LFO for amplitude modulation (state slot idx+1)
//       let lfoPhase = state[idx + 1];
//       lfoPhase = (lfoPhase + lfoPhaseIncrement) % 1.0;
//       state[idx + 1] = lfoPhase;
//       // Convert LFO to unipolar (0..1)
//       const lfo = (Math.sin(lfoPhase * 2 * Math.PI) + 1) * 0.5;

//       // Apply amplitude modulation
//       const amplitude = (1 - lfoDepth) + lfo * lfoDepth;
//       const output = carrier * amplitude * 2.3; // Scale to safe level

//       return [output]; // Mono output
//     }
//   };
// });

// ============================================================================
// EXAMPLE 2: Vortex Morph (Phase-Modulated Feedback Loop)
// ============================================================================
// An organic, growling cello-like tone that continuously evolves
// Uses phase modulation for complex, non-linear harmonics



// kanon('vortex-morph474', (mem, idx, sampleRate) => {
//   // --- SURGERY PARAMS (change these live!) ---
//   const baseFreq = 122.0;    // Deep G2 note
//   // const modRatio = 1.618;    // Golden Ratio (non-harmonic shimmer)
//   const modRatio = 1.1;    // Golden Ratio (non-harmonic shimmer)
//   const morphSpeed = 2;    // How fast the "vortex" breathes (Hz)
//   const intensity = 4.0;     // Modulation depth (try 50.0 for chaos!)

//   const p1Inc = baseFreq / sampleRate;
//   const p2Inc = (baseFreq * modRatio) / sampleRate;
//   const tInc = morphSpeed / sampleRate;

//   return {
//     update: () => {
//       // 1. Accumulate three phases
//       let p1 = mem[idx];     // Carrier Phase
//       let p2 = mem[idx + 1]; // Modulator Phase
//       let t  = mem[idx + 2]; // Global LFO for morphing

//       p1 = (p1 + p1Inc) % 1.0;
//       p2 = (p2 + p2Inc) % 1.0;
//       t  = (t + tInc) % 1.0;

//       mem[idx] = p1;
//       mem[idx + 1] = p2;
//       mem[idx + 2] = t;

//       // 2. The Functional Surgery
//       // Use the second osc to warp the time-space of the first osc
//       const depthLFO = Math.sin(t * 2 * Math.PI) * intensity;
//       const modulator = Math.sin(p2 * 2 * Math.PI) * depthLFO;

//       const sample = Math.sin(p1 * 2 * Math.PI + modulator);

//       // Return as a mono-vector (STRIDE 1)
//       return [sample * 0.5];
//     }
//   };
// });



// kanon('vortex-333', (mem, idx, sampleRate) => {
//   // --- SURGERY PARAMS (change these live!) ---
//   const baseFreq = 22.0;    // Deep G2 note
//   // const modRatio = 1.618;    // Golden Ratio (non-harmonic shimmer)
//   const modRatio = 2.1;    // Golden Ratio (non-harmonic shimmer)
//   const morphSpeed = 0.1;    // How fast the "vortex" breathes (Hz)
//   const intensity = 44;     // Modulation depth (try 50.0 for chaos!)

//   const p1Inc = baseFreq / sampleRate;
//   const p2Inc = (baseFreq * modRatio) / sampleRate;
//   const tInc = morphSpeed / sampleRate;

//   return {
//     update: () => {
//       // 1. Accumulate three phases
//       let p1 = mem[idx];     // Carrier Phase
//       let p2 = mem[idx + 1]; // Modulator Phase
//       let t  = mem[idx + 2]; // Global LFO for morphing

//       p1 = (p1 + p1Inc) % 1.0;
//       p2 = (p2 + p2Inc) % 1.0;
//       t  = (t + tInc) % 1.0;

//       mem[idx] = p1;
//       mem[idx + 1] = p2;
//       mem[idx + 2] = t;

//       // 2. The Functional Surgery
//       // Use the second osc to warp the time-space of the first osc
//       const depthLFO = Math.sin(t * 2 * Math.PI) * intensity;
//       const modulator = Math.sin(p2 * 2 * Math.PI) * depthLFO;

//       const sample = Math.sin(p1 * 2 * Math.PI + modulator);

//       // Return as a mono-vector (STRIDE 1)
//       return [sample * 0.5];
//     }
//   };
// });

// kanon('vortex-444', (mem, idx, sampleRate) => {
//   // --- SURGERY PARAMS (change these live!) ---
//   const baseFreq = 359.0;    // Deep G2 note
//   const modRatio = 1.618;    // Golden Ratio (non-harmonic shimmer)
//   // const modRatio = 1.1;    // Golden Ratio (non-harmonic shimmer)
//   const morphSpeed = 0.1;    // How fast the "vortex" breathes (Hz)
//   const intensity = 22.0;     // Modulation depth (try 50.0 for chaos!)

//   const p1Inc = baseFreq / sampleRate;
//   const p2Inc = (baseFreq * modRatio) / sampleRate;
//   const tInc = morphSpeed / sampleRate;

//   return {
//     update: () => {
//       // 1. Accumulate three phases
//       let p1 = mem[idx];     // Carrier Phase
//       let p2 = mem[idx + 1]; // Modulator Phase
//       let t  = mem[idx + 2]; // Global LFO for morphing

//       p1 = (p1 + p1Inc) % 1.0;
//       p2 = (p2 + p2Inc) % 1.0;
//       t  = (t + tInc) % 1.0;

//       mem[idx] = p1;
//       mem[idx + 1] = p2;
//       mem[idx + 2] = t;

//       // 2. The Functional Surgery
//       // Use the second osc to warp the time-space of the first osc
//       const depthLFO = Math.sin(t * 2 * Math.PI) * intensity;
//       const modulator = Math.sin(p2 * 2 * Math.PI) * depthLFO;

//       const sample = Math.sin(p1 * 2 * Math.PI + modulator);

//       // Return as a mono-vector (STRIDE 1)
//       return [sample * 0.2];
//     }
//   };
// });


// ============================================================================
// EXAMPLE 3: Van der Pol Oscillator (Functional Style)
// ============================================================================
// A non-linear limit cycle oscillator (sounds like a reed or heartbeat)
// Pure functional transformer: state -> nextState
// UNCOMMENT to hear it (it's slow and pulsing - that's correct!)

// The Physics: Pure state transition function
// const vanDerPolStep = (state, { mu, dt }) => {
//   const [x, y] = state;

//   // The non-linear damping term
//   const dx = y;
//   const dy = mu * (1 - x * x) * y - x;

//   return [x + dx * dt, y + dy * dt];
// };

// kanon('van-der-pol', (mem, idx) => {
//   // --- SURGERY PARAMETERS ---
//   // mu: 0.1 (sine-like) to 5.0 (aggressive/jagged)
//   // dt: Controls pitch/speed (0.01 = very low, 0.15 = audio rate)
//   const params = { mu: 1.5, dt: 0.12 }; // Increased dt for faster oscillation

//   // Initialize if empty
//   if (mem[idx] === 0) {
//     mem[idx] = 0.1;
//     mem[idx + 1] = 0.1;
//   }

//   return {
//     update: () => {
//       // 1. Extract current state
//       const current = [mem[idx], mem[idx + 1]];

//       // 2. Transform (Pure functional step)
//       const [nextX, nextY] = vanDerPolStep(current, params);

//       // 3. Commit to persistent memory
//       mem[idx] = nextX;
//       mem[idx + 1] = nextY;

//       // 4. Emit (X is the signal, Y is 90° out of phase)
//       return [nextX * 0.4]; // Mono output, scaled to safe level
//     }
//   };
// });

// ============================================================================
// EXAMPLE 3: Lorenz Attractor (Chaos Theory)
// ============================================================================
// The "butterfly effect" - never repeats the same path twice

// const lorenzStep = (state, { sigma, rho, beta, dt }) => {
//   const [x, y, z] = state;

//   const dx = sigma * (y - x);
//   const dy = x * (rho - z) - y;
//   const dz = x * y - beta * z;

//   return [x + dx * dt, y + dy * dt, z + dz * dt];
// };

// kanon('lorenz-chaos', (mem, idx) => {
//   // Classic Lorenz parameters
//   const params = { sigma: 10, rho: 28, beta: 8 / 3, dt: 0.005 };

//   // Initialize state if empty
//   if (mem[idx] === 0) {
//     mem[idx] = 0.1;
//     mem[idx + 1] = 0.1;
//     mem[idx + 2] = 0.1;
//   }

//   return {
//     update: () => {
//       // 1. Extract
//       const current = [mem[idx], mem[idx + 1], mem[idx + 2]];

//       // 2. Transform
//       const [nextX, nextY, nextZ] = lorenzStep(current, params);

//       // 3. Commit
//       mem[idx] = nextX;
//       mem[idx + 1] = nextY;
//       mem[idx + 2] = nextZ;

//       // 4. Emit (X-axis as audio, normalized)
//       return [nextX * 0.05]; // Mono output
//     }
//   };
// });

// ============================================================================
// EXAMPLE 4: FM Vortex (Frequency Modulation)
// ============================================================================
// Classic FM synthesis for metallic, shimmering tones

// kanon('fm-vortex', (mem, idx, sampleRate) => {
//   const carrierFreq = 110.0; // Base frequency
//   const modRatio = 1.618; // Golden ratio for organic shimmer
//   const modIndex = 2.5; // Modulation depth

//   const modPhaseIncrement = (carrierFreq * modRatio) / sampleRate;

//   return {
//     update: () => {
//       // Modulator oscillator
//       mem[idx] = (mem[idx] + modPhaseIncrement) % 1.0;
//       const modSignal = Math.sin(mem[idx] * 2 * Math.PI) * modIndex;

//       // Carrier oscillator (frequency modulated by modSignal)
//       const instantFreq = carrierFreq + modSignal * 100;
//       mem[idx + 1] = (mem[idx + 1] + instantFreq / sampleRate) % 1.0;

//       const output = Math.sin(mem[idx + 1] * 2 * Math.PI) * 0.5;
//       return [output]; // Mono output
//     }
//   };
// });

// ============================================================================
// FUNCTIONAL COMPOSITION EXAMPLES (Using helpers.js)
// ============================================================================
// The new functional API allows elegant signal composition!

// EXAMPLE 4: Simple sine with gain (functional style)
// kanon('functional-sine34', pipe(
//   sin(333),           // 440 Hz sine wave
//   gain(0.1)           // Scale amplitude to 30%
// ));

// EXAMPLE 5: Stereo panned sine
// kanon('panned-sine', pipe(
//   sin(330),           // E4 note
//   gain(0.4),
//   pan(0.75)           // Pan to the right (0=left, 0.5=center, 1=right)
// ));

// EXAMPLE 6: Mixed waveforms
// kanon('mixed-waves', pipe(
//   mix(
//     pipe(sin(240), gain(2)),    // A3 sine
//     pipe(saw(330), gain(2.2)),    // E4 sawtooth
//     // pipe(tri(440), gain(0.2))     // A4 triangle
//   ),
//   softClip()          // Soft clipping prevents distortion
// ));

// EXAMPLE 7: Amplitude modulation (tremolo)
// kanon('tremolo', pipe(
//   am(
//     lfo(4)            // 4 Hz modulator (0-1 range)
//   )(
//     sin(440)          // 440 Hz carrier
//   ),
//   gain(2)
// ));

// EXAMPLE 8: Stereo with independent channels
// kanon('stereo-pad', stereo(
//   pipe(sin(220), gain(3))
//   // ,    // Left: A3
//   // pipe(sin(330), gain(3))     // Right: E4 (perfect fifth)
// ));

// EXAMPLE 9: Binaural Beat (2Hz beat frequency for deep relaxation)
// kanon('binaural', pipe(
//   stereo(
//     pipe(sin(432), gain(0.3)),    // Left: 432 Hz
//     pipe(sin(434), gain(0.3))     // Right: 434 Hz (2Hz beat)
//   )
//   // Add feedback for ambient echo:
//   // ,feedback(2, 2)              // 300ms delay, 40% feedback
// ));

// ============================================================================
// LIVE SURGERY TIPS
// ============================================================================
// 1. Change parameters (freq, gain, pan) and save - sound morphs instantly!
// 2. Uncomment different examples to hear various approaches
// 3. Multiple kanon() calls play simultaneously (each needs unique ID)
// 4. State persists in globalThis.KANON_STATE during hot-reload
// 5. All signals auto-mix and soft-clip via Math.tanh() in updateAll()
// 6. Functional style (pipe/compose) is cleaner for simple signals
// 7. Manual style gives more control for complex state management
// ============================================================================

// ============================================================================
// TEST: Multi-Paradigm API (Earth + Fire)
// ============================================================================

import { Rhythmos } from './src/arche/rhythmos/index.js';
import { Kanon } from './src/arche/kanon/index.js';

// Rhythmos (Earth 🌍) - Stateful, explicit, smooth hot-reload
// Rhythmos.register('rhythmos-sine',
//   Rhythmos.pipe(
//     Rhythmos.sin(330),
//     Rhythmos.gain(0.1)
//   )
// );

// Kanon (Fire 🔥) - Pure function of time, mathematical beauty
// Using pure functional composition utilities
const sine440 = t => Math.sin(2 * Math.PI * 444 * t);
const sine660 = t => Math.sin(2 * Math.PI * 777 * t);  // Perfect fifth

// Compose transformations (right-to-left: read bottom-up)
// Kanon.register('golden-harmony',
//   Kanon.compose(
//     Kanon.gain(0.15),      // 3. Finally scale down
//     Kanon.softClip         // 2. Then soft clip
//   )(
//     Kanon.mix(             // 1. Start with mixed sines
//       Kanon.gain(0.5, sine440),
//       Kanon.gain(0.3, sine660)
//     )
//   )
// );

// ============================================================================
// TEST: Zap (⚡) - The Lightning Paradigm
// ============================================================================

import { Zap } from './src/arche/zap/index.js';

// console.log('⚡ Testing Zap paradigm...');

// // Minimal test
// const engine = Zap.createEngine({ sampleRate: 48000 });
// const testSine = s => Math.sin(2 * Math.PI * 440 * s.t);
// const samples = engine.render(testSine, 100);

// console.log('✅ Zap working:', {
//   samples: samples.length,
//   first: samples[0].toFixed(4),
//   range: {
//     min: Math.min(...samples).toFixed(4),
//     max: Math.max(...samples).toFixed(4)
//   }
// });

// Manual state management for hot-reload safety
// Zap.register('zap-harmony', s => {
//   // Initialize phases (survives hot-reload!)
//   if (!s.osc1) s.osc1 = 0;
//   if (!s.osc2) s.osc2 = 0;
//   if (!s.osc3) s.osc3 = 0;

//   // Accumulate phases
//   s.osc1 = (s.osc1 + 716 / s.sr) % 1.0;
//   s.osc2 = (s.osc2 + 111 / s.sr) % 1.0;
//   s.osc3 = (s.osc3 + 222 / s.sr) % 1.0;

//   // Generate and mix
//   return (
//     Math.sin(s.osc1 * 2 * Math.PI) +
//     Math.sin(s.osc2 * 2 * Math.PI) +
//     Math.sin(s.osc3 * 2 * Math.PI)
//   ) * 0.05;
// });

// ============================================================================
// UNIVERSAL HELPERS EXAMPLES - Uncomment to hear!
// ============================================================================
// These examples show how the SAME helpers work across all five paradigms

// ----------------------------------------------------------------------------
// EXAMPLE 1: Lowpass Filter on Different Paradigms
// ----------------------------------------------------------------------------

// 1a. Filter pure time function (Kanon - Fire 🔥)
// const pureTime = s => Math.sin(2 * Math.PI * 440 * s.t);
// Zap.register('filtered-kanon', Zap.lowpass(pureTime, 801));

// // 1b. Filter stateful oscillator (Rhythmos - Earth 🌍)
// const stateful = s => {
//   if (!s.phase) s.phase = 0;
//   s.phase = (s.phase + 440 / s.sr) % 1.0;
//   return s.phase * 2 - 1; // Sawtooth
// };
// Zap.register('filtered-rhythmos', Zap.lowpass(stateful, 999));

// // 1c. Filter Karplus-Strong string (Atomos - Air 💨)
// const pluck = s => {
//   const period = 109; // ~440 Hz
//   if (!s.buffer) {
//     s.buffer = Array.from({ length: period }, () => Math.random() * 2 - 1);
//   }
//   const idx = s.idx % period;
//   const output = s.buffer[idx];
//   const next = (idx + 1) % period;
//   s.buffer[idx] = (s.buffer[idx] + s.buffer[next]) * 0.5 * 0.996;
//   return output;
// };
// Zap.register('filtered-atomos', Zap.lowpass(pluck, 222));

// // 1d. Filter Van der Pol oscillator (Physis - Water 💧)
// const vdp = s => {
//   if (!s.vdp) s.vdp = { x: 0.1, y: 0.1 };
//   const dx = s.vdp.y;
//   const dy = 1.5 * (1 - s.vdp.x * s.vdp.x) * s.vdp.y - s.vdp.x;
//   s.vdp.x += dx * 0.12;
//   s.vdp.y += dy * 0.12;
//   return s.vdp.x;
// };
// Zap.register('filtered-physis', Zap.lowpass(vdp, 222));

// ----------------------------------------------------------------------------
// EXAMPLE 2: Feedback Delay (Echo)
// ----------------------------------------------------------------------------

// // Echo on pure sine
// const sine = s => Math.sin(2 * Math.PI * 320 * s.t);
// const echoed = Zap.feedbackDelay(sine, 0.01, 0.19);
// Zap.register('echo-sine', Zap.gain(echoed, 0.2));

// // Echo on chaos (Lorenz attractor)
// const chaos = s => {
//   if (!s.lorenz) s.lorenz = { x: 0.1, y: 0.1, z: 0.1 };
//   const dx = 10 * (s.lorenz.y - s.lorenz.x);
//   const dy = s.lorenz.x * (28 - s.lorenz.z) - s.lorenz.y;
//   const dz = s.lorenz.x * s.lorenz.y - (8/3) * s.lorenz.z;
//   s.lorenz.x += dx * 0.005;
//   s.lorenz.y += dy * 0.005;
//   s.lorenz.z += dz * 0.005;
//   return s.lorenz.x;
// };
// const echoedChaos = Zap.feedbackDelay(chaos, 0.25, 0.6);
// Zap.register('echo-chaos', Zap.gain(echoedChaos, 0.25));

// ----------------------------------------------------------------------------
// EXAMPLE 3: Crossfade Between Paradigms
// ----------------------------------------------------------------------------

// // Morph from Kanon (pure) to Physis (spring)
// const kanon = s => Math.sin(2 * Math.PI * 444 * s.t);
// const spring = s => {
//   if (!s.spring) s.spring = { position: 0, velocity: 10 };
//   const force = -100 * s.spring.position - 0.1 * s.spring.velocity;
//   s.spring.velocity += force * s.dt;
//   s.spring.position += s.spring.velocity * s.dt;
//   return s.spring.position;
// };
// const morphing = Zap.crossfade(kanon, spring, s => Math.min(1, s.t / 5));
// Zap.register('morph', Zap.gain(morphing, 0.2));

// ----------------------------------------------------------------------------
// EXAMPLE 4: Chained Effects (Pipe Pattern)
// ----------------------------------------------------------------------------

// // Take ANY paradigm and process it
// const raw = s => {
//   if (!s.phase) s.phase = 0;
//   s.phase = (s.phase + 110 / s.sr) % 1.0;
//   return s.phase * 2 - 1; // Sawtooth
// };

// const processed = Zap.pipe(
//   raw,
//   sig => Zap.lowpass(sig, 800),           // Filter
//   sig => Zap.feedbackDelay(sig, 0.3, 0.4), // Echo
//   sig => Zap.tremolo(sig, 3, 0.4),         // Tremolo
//   sig => Zap.softClip(sig, 1.5),           // Soft distortion
//   sig => Zap.gain(sig, 0.3)                // Final level
// );
// Zap.register('chain', processed);

// ----------------------------------------------------------------------------
// EXAMPLE 5: Parallel Processing (Multi-band)
// ----------------------------------------------------------------------------

// Split signal into three bands
// const source = s => {
//   if (!s.phase) s.phase = 0;
//   s.phase = (s.phase + 555 / s.sr) % 1.0;
//   return s.phase * 2 - 1;
// };

// const lowBand = Zap.lowpass(source, 400);
// const midBand = Zap.pipe(
//   source,
//   sig => Zap.highpass(sig, 400),
//   sig => Zap.lowpass(sig, 200)
// );
// const highBand = Zap.highpass(source, 200);

// const multiband = Zap.mix(
//   Zap.gain(lowBand, 1.2),
//   Zap.gain(midBand, 0.8),
//   Zap.gain(highBand, 0.4)
// );
// Zap.register('multiband', Zap.gain(multiband, 3));

// ----------------------------------------------------------------------------
// EXAMPLE 6: Modulation Between Paradigms
// ----------------------------------------------------------------------------

// // Use chaos to modulate crossfade between two oscillators
// const chaosLFO = s => {
//   if (!s.lorenz) s.lorenz = { x: 0.1, y: 0.1, z: 0.1 };
//   const dx = 10 * (s.lorenz.y - s.lorenz.x);
//   const dy = s.lorenz.x * (28 - s.lorenz.z) - s.lorenz.y;
//   const dz = s.lorenz.x * s.lorenz.y - (8/3) * s.lorenz.z;
//   s.lorenz.x += dx * 0.002;
//   s.lorenz.y += dy * 0.002;
//   s.lorenz.z += dz * 0.002;
//   // Map to 0-1 range
//   return (s.lorenz.x + 15) / 30;
// };

// const oscA = s => Math.sin(2 * Math.PI * 220 * s.t);
// const oscB = s => Math.sin(2 * Math.PI * 330 * s.t);

// const chaosModulated = Zap.crossfade(oscA, oscB, chaosLFO);
// Zap.register('chaos-mod', Zap.gain(chaosModulated, 0.2));

// ----------------------------------------------------------------------------
// EXAMPLE 7: Tremolo on Everything
// ----------------------------------------------------------------------------

// // Same tremolo works on all paradigms
// const kanon = s => Math.sin(2 * Math.PI * 440 * s.t);
// Zap.register('tremolo-kanon', Zap.tremolo(kanon, 4, 0.5));

// const atomos = s => {
//   const period = 109;
//   if (!s.buffer) {
//     s.buffer = Array.from({ length: period }, () => Math.random() * 2 - 1);
//   }
//   const idx = s.idx % period;
//   const output = s.buffer[idx];
//   const next = (idx + 1) % period;
//   s.buffer[idx] = (s.buffer[idx] + s.buffer[next]) * 0.5 * 0.996;
//   return output;
// };
// Zap.register('tremolo-atomos', Zap.tremolo(atomos, 4, 0.5));

// ----------------------------------------------------------------------------
// EXAMPLE 8: Bitcrusher (Lo-fi)
// ----------------------------------------------------------------------------

// const clean = s => Math.sin(2 * Math.PI * 330 * s.t);
// const crushed = Zap.bitcrush(clean, 4, 8); // 4-bit, 8x sample rate reduction
// Zap.register('lofi', Zap.gain(crushed, 0.3));

// ----------------------------------------------------------------------------
// EXAMPLE 9: Chorus Effect
// ----------------------------------------------------------------------------

// const dry = s => {
//   if (!s.phase) s.phase = 0;
//   s.phase = (s.phase + 220 / s.sr) % 1.0;
//   return Math.sin(s.phase * 2 * Math.PI);
// };
// const lush = Zap.chorus(dry, 0.5, 0.005, 0.5);
// Zap.register('chorus', Zap.gain(lush, 0.25));

// ----------------------------------------------------------------------------
// EXAMPLE 10: All Five Elements Together
// ----------------------------------------------------------------------------

// 🔥 Kanon (Fire) - Pure mathematical function
const fire = s => Math.sin(2 * Math.PI * 440 * s.t);

// 🌍 Rhythmos (Earth) - Stateful phase accumulation
const earth = s => {
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 330 / s.sr) % 1.0;
  return Math.sin(s.phase * 2 * Math.PI);
};

// 💨 Atomos (Air) - Discrete/granular (Karplus-Strong)
const air = s => {
  const period = 73;
  if (!s.buffer) {
    s.buffer = Array.from({ length: period }, () => Math.random() * 2 - 1);
  }
  const idx = s.idx % period;
  const output = s.buffer[idx];
  const next = (idx + 1) % period;
  s.buffer[idx] = (s.buffer[idx] + s.buffer[next]) * 0.5 * 0.997;
  return output;
};

// 💧 Physis (Water) - Physics simulation (spring)
const water = s => {
  if (!s.spring) s.spring = { position: 0, velocity: 5 };
  const force = -516 * s.spring.position - 0.05 * s.spring.velocity;
  s.spring.velocity += force * s.dt;
  s.spring.position += s.spring.velocity * s.dt;
  return s.spring.position;
};

// ✨ Aether (Ether) - Spatial field
const aether = s => {
  // Assume listener at (2, 1, 0)
  const x = 2, y = 1, z = 0;
  const distance = Math.sqrt(x*x + y*y + z*z);
  return Math.sin(2 * Math.PI * 220 * s.t) / (distance + 1);
};

// Apply SAME processing to all five!
const processElement = (element) => Zap.pipe(
  element,
  sig => Zap.lowpass(sig, 1200),
  sig => Zap.gain(sig, 0.15)
);

const elements = Zap.mix(
  // processElement(fire),
  // processElement(earth),
  // processElement(air),
  // processElement(water),
  // processElement(aether)
);

Zap.register('five-elements', elements);
