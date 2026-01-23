// ============================================================================
// WAVE EXAMPLE SESSION
// ============================================================================
// Run with: bun runner.js example-session.js
// Edit this file and save to hear changes in real-time!

import wave from './index.js';
import { pipe } from './wave-fp.js';
import { sin, gain, clip, mix, stereo } from './wave-dsp.js';

// ============================================================================
// EXAMPLE 1: PURE JAVASCRIPT (NO HELPERS)
// ============================================================================

wave('pure', t => Math.sin(2 * Math.PI * 440 * t) * 0.8);

// ============================================================================
// EXAMPLE 2: WITH HELPERS (DISTORTION)
// ============================================================================

// wave('composed', pipe(
//   sin(440),
//   gain(2),
//   clip(0.7),
//   gain(0.5)
// ));

// ============================================================================
// EXAMPLE 3: STEREO (BINAURAL BEATS)
// ============================================================================

// wave('binaural', t => [
//   Math.sin(2 * Math.PI * 440 * t) * 0.8,  // Left
//   Math.sin(2 * Math.PI * 445 * t) * 0.8   // Right
// ]);

// With helpers:
// wave('binaural', pipe(
//   stereo(sin(440), sin(445)),
//   gain(0.8)
// ));

// ============================================================================
// EXAMPLE 4: MIX MULTIPLE SIGNALS (CHORD)
// ============================================================================

// wave('chord', pipe(
//   mix(
//     sin(220),      // Root
//     sin(277),      // Third
//     sin(330)       // Fifth
//   ),
//   gain(0.4)
// ));

// ============================================================================
// EXAMPLE 5: DISTORTION
// ============================================================================

// wave('distorted', pipe(
//   sin(110),
//   gain(3),
//   clip(0.7),
//   gain(0.5)
// ));

// ============================================================================
// EXAMPLE 6: MIX STYLES
// ============================================================================

// wave('mixed', t => {
//   // Direct computation for bass
//   const bass = Math.sin(2 * Math.PI * 55 * t) * 0.5;
//
//   // Pipe for lead
//   const lead = pipe(
//     sin(880),
//     gain(2),
//     clip(0.7),
//     gain(0.3)
//   )(t);
//
//   return bass + lead;
// });

console.log('\nWave is running!');
console.log('Active waves:', wave.list());
console.log('\nTry uncommenting different examples and saving this file.');
console.log('Press Ctrl+C to exit.\n');
