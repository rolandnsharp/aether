// wave-dsp.js
// A functional DSP library wrapping genish.js
// These helpers work with genish graph objects

// Note: In the worklet, genish is available as globalThis.genish
// In the browser, it's window.genish

// Basic oscillators - work with genish objects
const cycle = (freq) => genish.cycle(freq);
const phasor = (freq) => genish.phasor(freq);
const noise = () => genish.noise();

// Math helpers
const add = (...args) => {
  if (args.length === 0) return 0;
  if (args.length === 1) return args[0];
  return args.reduce((a, b) => genish.add(a, b));
};

const mul = (...args) => {
  if (args.length === 0) return 1;
  if (args.length === 1) return args[0];
  return args.reduce((a, b) => genish.mul(a, b));
};

// Composable examples - these take a time parameter
const bass = (t, freq) => mul(genish.sin(mul(2 * Math.PI * freq, t)), 0.4);

const wobble = (t, freq, rate) => {
  const mod = mul(genish.cycle(rate), 20);
  const modFreq = add(freq, mod);
  return mul(genish.sin(mul(2 * Math.PI, modFreq, t)), 0.3);
};

// Make functions available globally
// In worklet context, attach to globalThis
// In browser context, attach to window
const globalScope = typeof window !== 'undefined' ? window : globalThis;

globalScope.cycle = cycle;
globalScope.phasor = phasor;
globalScope.noise = noise;
globalScope.add = add;
globalScope.mul = mul;
globalScope.bass = bass;
globalScope.wobble = wobble;
