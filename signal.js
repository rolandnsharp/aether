// signal.js - KANON Live-Coding Interface
// ============================================================================
// LIVE SURGERY: Change values while playing - no clicks, instant morphs!
// Each oscillator has a "slot" number (0-62) that preserves its phase.
// ============================================================================

// Example 1: Pure tone - try changing 220 to 440 mid-performance
wave('tone', t => liveSin(220, 0));

// Example 2: FM synthesis with continuous phase
// Try changing modulation depth (100 → 500) or carrier freq (440 → 220)
// wave('fm', t => {
//   const mod = gain(100, liveSin(5, 1));      // 5Hz LFO at slot 1
//   const carrier = liveSin(add(440, mod), 0); // Carrier at slot 0
//   return gain(0.5, carrier);
// });

// Example 3: Rhythmic gate using square wave
// wave('gate', t => {
//   const rhythm = liveSquare(2, 2);           // 2Hz gate at slot 2
//   const tone = liveSin(330, 3);              // 330Hz tone at slot 3
//   return gain(0.6, mul(tone, rhythm));
// });

// Example 4: Binaural beating (requires stereo support - TODO)
// wave('binaural', t => {
//   const left = liveSin(440, 4);
//   const right = liveSin(445, 5);  // 5Hz difference creates spatial effect
//   return [gain(0.3, left), gain(0.3, right)];
// });

// Example 5: Generative texture using persistent time
// wave('texture', t => {
//   const T = liveTime(8, 10);  // 8-second loop at slot 10
//   const freq = add(110, mul(T, 50));  // Frequency rises over 8 seconds
//   return gain(0.4, liveSin(freq, 11));
// });

// Example 6: Multiple voices (chord)
// wave('chord', t => {
//   const root = liveSin(220, 20);
//   const third = liveSin(277, 21);  // Major third
//   const fifth = liveSin(330, 22);  // Perfect fifth
//   return gain(0.2, add(root, third, fifth));
// });

// ============================================================================
// HOW TO PERFORM LIVE SURGERY:
// 1. Pick an example, uncomment it
// 2. Start the engine: bun run host.ts
// 3. While it's playing, change a frequency or modulation depth
// 4. Save the file
// 5. Result: The sound morphs instantly without any click or phase reset
// ============================================================================
