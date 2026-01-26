// signal.js
// Define your audio signals here using helper functions from wave-dsp.js
// All waves use the time parameter 't' provided by genish.accum()

// Example 1: Simple sine tone using pure math
wave('tone', t => {
  return mul(genish.sin(mul(2 * Math.PI * 440, t)), 0.3);
});

// Example 2: Bass note using helper function
// wave('bass', t => bass(t, 110));

// Example 3: Wobble bass with frequency modulation
// wave('wobble', t => wobble(t, 110, 0.5));

// Example 4: White noise
// wave('noise', t => mul(noise(), 0.1));

// Example 5: Custom helper - vibrato
// const myVibrato = (t, freq, depth, rate) => {
//   const mod = mul(genish.sin(mul(2 * Math.PI * rate, t)), depth);
//   const modFreq = add(freq, mod);
//   return mul(genish.sin(mul(2 * Math.PI, modFreq, t)), 0.3);
// };
// wave('vibrato', t => myVibrato(t, 440, 10, 5));

// Example 6: Multiple signals playing together (chord)
// wave('low', t => mul(genish.sin(mul(2 * Math.PI * 110, t)), 0.2));
// wave('mid', t => mul(genish.sin(mul(2 * Math.PI * 220, t)), 0.15));
// wave('high', t => mul(genish.sin(mul(2 * Math.PI * 440, t)), 0.15));
