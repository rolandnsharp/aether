// wave-dsp.js
// A functional DSP library wrapping genish.js
// These helpers work with genish graph objects

// Note: In the worklet, genish is available as globalThis.genish
// In the browser, it's window.genish

// Alias Math.PI for clean syntax in signal.js (compiled as a constant)
const PI = Math.PI;

// Basic oscillators - work with genish objects
const cycle = (freq) => globalThis.genish.cycle(freq);
const phasor = (freq) => globalThis.genish.phasor(freq);
const noise = () => globalThis.genish.noise();

// Math helpers - variadic wrappers for genish primitives
const add = (...args) => {
  if (args.length === 0) return 0;
  if (args.length === 1) return args[0];
  return args.reduce((a, b) => globalThis.genish.add(a, b));
};

const mul = (...args) => {
  if (args.length === 0) return 1;
  if (args.length === 1) return args[0];
  return args.reduce((a, b) => globalThis.genish.mul(a, b));
};

// Composable helpers - The "Kanonical" Way
// IMPORTANT: Use cycle() for oscillators (it handles phase internally, preventing precision loss)
// Use 't' parameter for modulation, envelopes, and control signals

const bass = (freq) => {
  // Use cycle() instead of sin(2π*freq*t) - it's optimized and stable forever
  return g.mul(g.cycle(freq), 0.6); // Louder for laptop speakers
};

const wobble = (freq, rate) => {
  // FM synthesis using cycle() for both carrier and modulator
  const mod = g.mul(g.cycle(rate), 20);
  const modFreq = g.add(freq, mod);
  return g.mul(g.cycle(modFreq), 0.5);
};

// Make functions available globally
// In worklet context, attach to globalThis
// In browser context, attach to window
const globalScope = typeof window !== 'undefined' ? window : globalThis;

// Expose ALL genish primitives for compiled callbacks
// The compiled genish code references these by bare name (e.g., sin(), mul(), add(), etc.)
const g = globalScope.genish;
globalScope.sin = g.sin;
globalScope.cos = g.cos;
globalScope.tan = g.tan;
globalScope.tanh = g.tanh;
globalScope.abs = g.abs;
globalScope.round = g.round;
globalScope.add = g.add;  // genish primitive, not our wrapper
globalScope.sub = g.sub;
globalScope.mul = g.mul;  // genish primitive, not our wrapper
globalScope.div = g.div;
globalScope.pow = g.pow;
globalScope.sqrt = g.sqrt;
globalScope.min = g.min;
globalScope.max = g.max;
globalScope.accum = g.accum;
globalScope.counter = g.counter;
globalScope.data = g.data;
globalScope.peek = g.peek;

// Expose constants and helper functions
globalScope.PI = PI;
globalScope.cycle = cycle;
globalScope.phasor = phasor;
globalScope.noise = noise;
globalScope.bass = bass;
globalScope.wobble = wobble;
