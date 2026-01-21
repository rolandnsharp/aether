const Speaker = require('speaker');
const R = require('ramda');

// ============================================================================
// RAMDA - MANDELBROT MUSIC
// ============================================================================

const SAMPLE_RATE = 48000;

// ============================================================================
// Y-COMBINATOR (for recursion)
// ============================================================================

const Y = fn => (x => fn(v => x(x)(v)))(x => fn(v => x(x)(v)));

// ============================================================================
// MUSICAL UTILITIES
// ============================================================================

// Scales
const scales = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

// Convert scale degree to frequency (curried for partial application)
const freq = R.curry((root, scale, degree) => {
  const octaves = Math.floor(degree / scale.length);
  const scaleDegree = R.modulo(degree, scale.length);
  const semitones = scale[scaleDegree] + (octaves * 12);
  return root * Math.pow(2, semitones / 12);
});

// Step sequencer - returns { index, phase }
const step = R.curry((t, bpm, steps) => {
  const beatDuration = 60 / bpm;
  const stepDuration = beatDuration / (steps / 4);
  const index = t / stepDuration;
  const phase = R.modulo(t, stepDuration) / stepDuration;
  return { index, phase };
});

// Exponential envelope
const expEnv = R.curry((phase, steepness) =>
  Math.exp(-phase * steepness)
);

// ============================================================================
// MANDELBROT SET
// ============================================================================

// Musical Mandelbrot: z → z² + c, returns escape time (curried)
const musicalMandelbrot = R.curry((cx, cy, maxDepth) =>
  Y(recurse => (zx, zy, depth) => {
    if (depth >= maxDepth) return depth;
    if (zx * zx + zy * zy > 4) return depth;

    const zx2 = zx * zx - zy * zy;
    const zy2 = 2 * zx * zy;

    return recurse(zx2 + cx, zy2 + cy, depth + 1);
  })(0, 0, 0)
);

// ============================================================================
// FUNCTIONAL HELPERS
// ============================================================================

// Oscillator generator
const sin = R.curry((freq, t) =>
  Math.sin(2 * Math.PI * freq * t)
);

// Gain multiplier
const gain = R.curry((amount, sample) => sample * amount);

// Conditional value
const when = R.curry((predicate, value, fallback) =>
  predicate ? value : fallback
);

// ============================================================================
// SIGNAL GENERATORS (using point-free style where possible)
// ============================================================================

// Map Mandelbrot escape time to music
const mandelbrotExplore = t => {
  // Navigation parameters
  const zoom = 1 + t / 20;
  const centerX = -0.5;
  const centerY = 0;
  const angle = t * 0.1;
  const radius = 0.5 / zoom;

  // Calculate position
  const cx = centerX + Math.cos(angle) * radius;
  const cy = centerY + Math.sin(angle) * radius;

  // Get escape time with scaled depth
  const maxDepth = Math.floor(50 + Math.log2(zoom) * 10);
  const escapeTime = musicalMandelbrot(cx, cy, maxDepth);

  // Musical mapping
  const degree = R.modulo(escapeTime, 8);
  const octave = R.modulo(Math.floor(escapeTime / 8), 3);
  const f = freq(220 * (octave + 1), scales.minor, degree);

  // Rhythm
  const { phase } = step(t, 100, 16);
  const trigger = R.modulo(escapeTime, 3) === 0;

  return R.pipe(
    sin(f),
    R.multiply(expEnv(phase, 5)),
    gain(0.2),
    when(trigger, R.__, 0)
  )(t);
};

// ============================================================================
// FRACTAL COMPOSITION (multi-scale)
// ============================================================================

// Generate Mandelbrot at multiple scales
const fractalComposition = R.curry((zoom, t) => {
  const angle = t * 0.05;
  const cx = -0.5 + Math.cos(angle) * 0.3 / zoom;
  const cy = Math.sin(angle) * 0.3 / zoom;
  const baseDepth = Math.floor(50 + Math.log2(zoom) * 10);

  return {
    macro: musicalMandelbrot(cx, cy, baseDepth),
    meso: musicalMandelbrot(cx * 2, cy * 2, baseDepth + 10),
    micro: musicalMandelbrot(cx * 4, cy * 4, baseDepth + 20)
  };
});

// Generate harmony from macro structure
const generateHarmony = R.curry((t, macro) => {
  const harmonyDegree = R.modulo(macro, 7);
  const harmonyFreq = freq(110, scales.minor, harmonyDegree);
  return R.pipe(
    sin(harmonyFreq),
    gain(0.1)
  )(t);
});

// Generate melody from meso structure
const generateMelody = R.curry((t, phase, meso) => {
  const melodyDegree = R.modulo(meso * 2, 7);
  const melodyFreq = freq(330, scales.minor, melodyDegree);
  const melodicTrigger = R.modulo(meso, 3) === 0;

  return melodicTrigger
    ? R.pipe(
        sin(melodyFreq),
        R.multiply(expEnv(phase, 5)),
        gain(0.15)
      )(t)
    : 0;
});

// Generate rhythm from micro structure
const generateRhythm = R.curry((t, phase, micro) => {
  const rhythmicTrigger = R.modulo(micro, 2) === 0 && phase < 0.1;

  return rhythmicTrigger
    ? R.pipe(
        sin(880),
        R.multiply(expEnv(phase * 20, 15)),
        gain(0.1)
      )(t)
    : 0;
});

// Ultimate fractal universe composition
const fractalUniverse = t => {
  const zoomLevel = 1 + t / 30;
  const { macro, meso, micro } = fractalComposition(zoomLevel, t);
  const { phase } = step(t, 100, 16);

  // Sum all layers
  return R.sum([
    generateHarmony(t, macro),
    generateMelody(t, phase, meso),
    generateRhythm(t, phase, micro)
  ]);
};

// ============================================================================
// POINT-FREE ALTERNATIVE (more functional)
// ============================================================================

// Using Ramda's converge for parallel computation
const fractalUniversePointFree = R.converge(
  R.sum,
  [
    // Harmony layer
    t => {
      const zoomLevel = 1 + t / 30;
      const { macro } = fractalComposition(zoomLevel, t);
      return generateHarmony(t, macro);
    },
    // Melody layer
    t => {
      const zoomLevel = 1 + t / 30;
      const { meso } = fractalComposition(zoomLevel, t);
      const { phase } = step(t, 100, 16);
      return generateMelody(t, phase, meso);
    },
    // Rhythm layer
    t => {
      const zoomLevel = 1 + t / 30;
      const { micro } = fractalComposition(zoomLevel, t);
      const { phase } = step(t, 100, 16);
      return generateRhythm(t, phase, micro);
    }
  ]
);

// ============================================================================
// PARAMETERIZED MANDELBROT EXPLORER
// ============================================================================

// Factory function for creating Mandelbrot explorers
const createMandelbrotExplorer = R.curry((config, t) => {
  const {
    zoomSpeed = 20,
    centerX = -0.5,
    centerY = 0,
    rotationSpeed = 0.1,
    radiusScale = 0.5,
    root = 220,
    scale = scales.minor,
    bpm = 100,
    triggerMod = 3
  } = config;

  const zoom = 1 + t / zoomSpeed;
  const angle = t * rotationSpeed;
  const radius = radiusScale / zoom;
  const cx = centerX + Math.cos(angle) * radius;
  const cy = centerY + Math.sin(angle) * radius;
  const maxDepth = Math.floor(50 + Math.log2(zoom) * 10);
  const escapeTime = musicalMandelbrot(cx, cy, maxDepth);

  const degree = R.modulo(escapeTime, 8);
  const octave = R.modulo(Math.floor(escapeTime / 8), 3);
  const f = freq(root * (octave + 1), scale, degree);

  const { phase } = step(t, bpm, 16);
  const trigger = R.modulo(escapeTime, triggerMod) === 0;

  return when(
    trigger,
    R.pipe(
      sin(f),
      R.multiply(expEnv(phase, 5)),
      gain(0.2)
    )(t),
    0
  );
});

// Pre-configured explorers
const seahorseValley = createMandelbrotExplorer({
  centerX: -0.75,
  centerY: 0.1,
  zoomSpeed: 15,
  root: 330
});

const elephantValley = createMandelbrotExplorer({
  centerX: 0.285,
  centerY: 0.01,
  zoomSpeed: 25,
  root: 220,
  scale: scales.major
});

// ============================================================================
// AUDIO OUTPUT
// ============================================================================

function playSignal(signalFn, duration = 30) {
  const speaker = new Speaker({
    channels: 2,
    bitDepth: 16,
    sampleRate: SAMPLE_RATE
  });

  const BUFFER_SIZE = 4096;
  const buffer = Buffer.alloc(BUFFER_SIZE * 2 * 2);

  let currentTime = 0;
  const endTime = duration;

  function writeNextBuffer() {
    if (currentTime >= endTime) {
      speaker.end();
      console.log('Done!');
      return;
    }

    for (let i = 0; i < BUFFER_SIZE; i++) {
      const t = currentTime + (i / SAMPLE_RATE);
      const sample = signalFn(t);

      const clamped = R.clamp(-1, 1, sample);
      const int16 = Math.floor(clamped * 32767);

      const offset = i * 4;
      buffer.writeInt16LE(int16, offset);
      buffer.writeInt16LE(int16, offset + 2);
    }

    currentTime += BUFFER_SIZE / SAMPLE_RATE;
    speaker.write(buffer, writeNextBuffer);
  }

  console.log('Playing Mandelbrot music (Ramda style)...');
  writeNextBuffer();
}

// ============================================================================
// RUN IT
// ============================================================================

// Choose one:
// playSignal(mandelbrotExplore, 30);        // Basic exploration
// playSignal(fractalUniverse, 30);          // Ultimate composition
// playSignal(fractalUniversePointFree, 30); // Point-free style
// playSignal(seahorseValley, 30);           // Seahorse valley
playSignal(elephantValley, 30);           // Elephant valley
