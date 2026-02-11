// Welcome to your live-coding session!
// This file is watched by `bun --hot`.
// Save it and hear your changes instantly.

import { register, clear } from './index.js';
import * as _ from './helpers.js';

// Using `clear(true)` here will wipe all state on every save,
// which can be useful for development but prevents phase continuity.
// clear(true); 

// --- Example 1: Simple Sine Wave ---
// This signal uses one state slot: `s.state[0]` for its phase.
register('sine-440', s => {
  s.state[0] = (s.state[0] || 0) + 440 / s.sr;
  s.state[0] %= 1.0;
  return Math.sin(s.state[0] * 2 * Math.PI) * 0.5;
});

// --- Example 2: Using a Stateful Helper ---
// We compose a signal with the `tremolo` helper.
// The inner signal uses `s.state[0]` for its phase.
// The `tremolo` helper uses `s.state[1]` for its own internal LFO phase.
// This requires manual state management.
// register('tremolo-sine',
//   s => {
//     // Manually create a proxy-like object to make state management clearer.
//     // This is purely for readability within this function and has no performance cost.
//     let state = {
//       get main_phase() { return s.state[0]; },
//       set main_phase(v) { s.state[0] = v; },
//       get lfo_phase() { return s.state[1]; },
//       set lfo_phase(v) { s.state[1] = v; }
//     };
    
//     // The inner signal to be modulated
//     const signalFn = () => {
//       state.main_phase = (state.main_phase || 0) + 330 / s.sr;
//       state.main_phase %= 1.0;
//       return Math.sin(state.main_phase * 2 * Math.PI);
//     };

//     // The tremolo helper
//     const tremoloFn = (inputSignal) => {
//       state.lfo_phase = (state.lfo_phase || 0) + 5 / s.sr; // 5 Hz LFO
//       state.lfo_phase %= 1.0;
//       const lfo = (Math.sin(state.lfo_phase * 2 * Math.PI) + 1) * 0.5;
//       return inputSignal * (1 - 0.7 + lfo * 0.7); // 0.7 depth
//     };
    
//     return tremoloFn(signalFn());
//   }
// );


// // --- Example 3: Stateless Signal ---
// // This signal is a pure function of time and needs no persistent state.
// register('panned-noise',
//   _.pan(
//     s => (Math.random() * 2 - 1) * 0.1, // White noise
//     s => Math.sin(s.t * 0.2)             // Pan position is a pure function of time
//   )
// );