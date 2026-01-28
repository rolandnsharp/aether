// signals.js - Live Coding Interface (New FRP Architecture)
// ============================================================================
// LIVE CODING: Edit this file while audio is playing for instant updates!
// ============================================================================
// Hot-reload compatible: Uses globalThis.KANON_STATE for phase continuity
// ============================================================================

import { kanon } from './kanon.js';

// ============================================================================
// EXAMPLE 1: Breathing Sine (Simple amplitude modulation)
// ============================================================================
// A pure sine wave whose volume breathes with an LFO

// kanon('breathing-sine', (state, idx) => {
//   const carrierFreq = 220.0; // A3 note
//   const lfoFreq = 0.5; // Breathe twice per second
//   const lfoDepth = 0.7; // How much the volume changes

//   return {
//     update: (sr) => {
//       // Carrier oscillator (state slot idx)
//       let carrierPhase = state[idx];
//       carrierPhase = (carrierPhase + carrierFreq / sr) % 1.0;
//       state[idx] = carrierPhase;
//       const carrier = Math.sin(carrierPhase * 2 * Math.PI);

//       // LFO for amplitude modulation (state slot idx+1)
//       let lfoPhase = state[idx + 1];
//       lfoPhase = (lfoPhase + lfoFreq / sr) % 1.0;
//       state[idx + 1] = lfoPhase;
//       // Convert LFO to unipolar (0..1)
//       const lfo = (Math.sin(lfoPhase * 2 * Math.PI) + 1) * 0.5;

//       // Apply amplitude modulation
//       const amplitude = (1 - lfoDepth) + lfo * lfoDepth;
//       const output = carrier * amplitude * 0.5; // Scale to safe level

//       return [output]; // Mono output
//     }
//   };
// });

// ============================================================================
// EXAMPLE 2: Simple Sine Oscillator (Fast & Musical)
// ============================================================================
// A basic sine wave - the "hello world" of audio DSP

kanon('sine-drone', (mem, idx) => {
  const freq = 220.0; // A3 note - change this live!

  return {
    update: (sr) => {
      // Increment phase (0..1)
      let phase = mem[idx];
      phase = (phase + freq / sr) % 1.0;
      mem[idx] = phase;

      // Convert to sine wave
      const output = Math.sin(phase * 2 * Math.PI) * 0.3;
      return [output]; // Mono output
    }
  };
});

// ============================================================================
// EXAMPLE 3: Van der Pol Oscillator (Functional Style)
// ============================================================================
// A non-linear limit cycle oscillator (sounds like a reed or heartbeat)
// Pure functional transformer: state -> nextState
// UNCOMMENT to hear it (it's slow and pulsing - that's correct!)

// // The Physics: Pure state transition function
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

// kanon('fm-vortex', (mem, idx) => {
//   const carrierFreq = 110.0; // Base frequency
//   const modRatio = 1.618; // Golden ratio for organic shimmer
//   const modIndex = 2.5; // Modulation depth

//   return {
//     update: (sr) => {
//       // Modulator oscillator
//       mem[idx] = (mem[idx] + (carrierFreq * modRatio) / sr) % 1.0;
//       const modSignal = Math.sin(mem[idx] * 2 * Math.PI) * modIndex;

//       // Carrier oscillator (frequency modulated by modSignal)
//       const instantFreq = carrierFreq + modSignal * 100;
//       mem[idx + 1] = (mem[idx + 1] + instantFreq / sr) % 1.0;

//       const output = Math.sin(mem[idx + 1] * 2 * Math.PI) * 0.5;
//       return [output]; // Mono output
//     }
//   };
// });

// ============================================================================
// LIVE SURGERY TIPS
// ============================================================================
// 1. Change parameters (mu, dt, freq) and save - sound morphs instantly!
// 2. Uncomment different examples to hear various oscillators
// 3. Multiple kanon() calls play simultaneously (each needs unique ID)
// 4. State persists in globalThis.KANON_STATE during hot-reload
// 5. All signals auto-mix and soft-clip via Math.tanh() in updateAll()
// ============================================================================
