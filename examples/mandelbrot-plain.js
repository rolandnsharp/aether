const Speaker = require('speaker');

// ============================================================================
// PLAIN FUNCTIONS - MANDELBROT MUSIC
// ============================================================================

const SAMPLE_RATE = 48000;

// ============================================================================
// MUSICAL UTILITIES
// ============================================================================

// Scales
const scales = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

// Convert scale degree to frequency
const freq = (root, scale, degree) => {
  const octaves = Math.floor(degree / scale.length);
  const scaleDegree = degree % scale.length;
  const semitones = scale[scaleDegree] + (octaves * 12);
  return root * Math.pow(2, semitones / 12);
};

// Step sequencer - returns { index, phase }
const step = (t, bpm, steps) => {
  const beatDuration = 60 / bpm;
  const stepDuration = beatDuration / (steps / 4);
  const totalTime = t;
  const index = totalTime / stepDuration;
  const phase = (totalTime % stepDuration) / stepDuration;
  return { index, phase };
};

// Exponential envelope
const expEnv = (phase, steepness) => {
  return Math.exp(-phase * steepness);
};

// ============================================================================
// MANDELBROT SET
// ============================================================================

// Musical Mandelbrot: z → z² + c, returns escape time
function musicalMandelbrot(cx, cy, maxDepth = 50) {
  function iterate(zx, zy, depth) {
    if (depth >= maxDepth) return depth;

    // Check escape condition (magnitude > 2)
    if (zx * zx + zy * zy > 4) return depth;

    // Complex multiplication: z² = (zx + i*zy)²
    const zx2 = zx * zx - zy * zy;
    const zy2 = 2 * zx * zy;

    // Add c: z² + c
    return iterate(zx2 + cx, zy2 + cy, depth + 1);
  }

  return iterate(0, 0, 0);
}

// ============================================================================
// SIGNAL GENERATOR
// ============================================================================

// Map Mandelbrot escape time to music
const mandelbrotExplore = t => {
  // Navigate through parameter space (complex plane)
  const zoom = 1 + t / 20;  // Linear zoom (smooth and intuitive)
  const centerX = -0.5;     // Center of interesting region
  const centerY = 0;

  // Current position moves through space
  const angle = t * 0.1;
  const radius = 0.5 / zoom;
  const cx = centerX + Math.cos(angle) * radius;
  const cy = centerY + Math.sin(angle) * radius;

  // Scale maxDepth with zoom to maintain detail
  const maxDepth = Math.floor(50 + Math.log2(zoom) * 10);
  const escapeTime = musicalMandelbrot(cx, cy, maxDepth);

  // Map to musical parameters
  const degree = escapeTime % 8;
  const octave = Math.floor(escapeTime / 8) % 3;
  const f = freq(220 * (octave + 1), scales.minor, degree);

  // Rhythm from iteration count
  const { phase } = step(t, 100, 16);
  const trigger = escapeTime % 3 === 0;

  if (!trigger) return 0;

  return Math.sin(2 * Math.PI * f * t) * expEnv(phase, 5) * 0.2;
};

// ============================================================================
// INFINITE ZOOM VERSION
// ============================================================================

// Famous zoom coordinates
const zoomTargets = [
  { x: -0.5, y: 0, name: 'main' },           // Main cardioid
  { x: -0.75, y: 0.1, name: 'seahorse' },    // Seahorse valley
  { x: -0.1011, y: 0.9563, name: 'spiral' }, // Spiral
  { x: 0.285, y: 0.01, name: 'elephant' }    // Elephant valley
];

// Infinite zoom signal with mutable state
let targetZoom = 1;
let currentTarget = 0;

const infiniteZoom = t => {
  // Switch targets every 20 seconds
  if (t % 20 < 0.1) {
    currentTarget = (currentTarget + 1) % zoomTargets.length;
  }

  const target = zoomTargets[currentTarget];
  targetZoom *= 1.01;  // Exponential zoom - goes forever!

  // Calculate position at current zoom
  const width = 2 / targetZoom;
  const cx = target.x + Math.cos(t * 0.2) * width * 0.1;
  const cy = target.y + Math.sin(t * 0.2) * width * 0.1;

  // CRITICAL: Scale maxDepth with zoom for infinite detail
  const maxDepth = Math.floor(100 + Math.log2(targetZoom) * 15);
  const escape = musicalMandelbrot(cx, cy, maxDepth);

  // Musical mapping changes with zoom level
  const scaleIndex = Math.floor(Math.log2(targetZoom)) % 7;
  const degree = (escape + scaleIndex) % 7;
  const octave = Math.floor(escape / 7) % 3;

  const { phase } = step(t, 80 + targetZoom * 0.01, 16);
  const f = freq(220 * (octave + 1), scales.minor, degree);

  const trigger = escape % 2 === 0;
  if (!trigger) return 0;

  return Math.sin(2 * Math.PI * f * t) * expEnv(phase, 6) * 0.15;
};

// ============================================================================
// ULTIMATE FRACTAL COMPOSITION
// ============================================================================

const fractalComposition = (t, zoom = 1) => {
  // Parameter space coordinates
  const angle = t * 0.05;
  const cx = -0.5 + Math.cos(angle) * 0.3 / zoom;
  const cy = Math.sin(angle) * 0.3 / zoom;

  // Scale maxDepth with zoom to maintain detail at all levels
  const baseDepth = Math.floor(50 + Math.log2(zoom) * 10);

  // Generate structure at multiple scales
  const macro = musicalMandelbrot(cx, cy, baseDepth);              // Phrase structure
  const meso = musicalMandelbrot(cx * 2, cy * 2, baseDepth + 10);  // Bar structure
  const micro = musicalMandelbrot(cx * 4, cy * 4, baseDepth + 20); // Beat structure

  return { macro, meso, micro };
};

const fractalUniverse = t => {
  const zoomLevel = 1 + t / 30;  // Linear zoom over 30 seconds
  const { macro, meso, micro } = fractalComposition(t, zoomLevel);

  const { index, phase } = step(t, 100, 16);

  // Macro determines harmony
  const harmonyDegree = macro % 7;
  const harmonyFreq = freq(110, scales.minor, harmonyDegree);
  const harmony = Math.sin(2 * Math.PI * harmonyFreq * t) * 0.1;

  // Meso determines melody
  const melodyDegree = (meso * 2) % 7;
  const melodyFreq = freq(330, scales.minor, melodyDegree);
  const melodicTrigger = meso % 3 === 0;
  const melody = melodicTrigger
    ? Math.sin(2 * Math.PI * melodyFreq * t) * expEnv(phase, 5) * 0.15
    : 0;

  // Micro determines rhythm
  const rhythmicTrigger = micro % 2 === 0 && phase < 0.1;
  const rhythm = rhythmicTrigger
    ? Math.sin(2 * Math.PI * 880 * t) * expEnv(phase * 20, 15) * 0.1
    : 0;

  return harmony + melody + rhythm;
};

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
  const buffer = Buffer.alloc(BUFFER_SIZE * 2 * 2); // stereo, 16-bit

  let currentTime = 0;
  const endTime = duration;

  function writeNextBuffer() {
    if (currentTime >= endTime) {
      speaker.end();
      console.log('Done!');
      return;
    }

    // Fill buffer
    for (let i = 0; i < BUFFER_SIZE; i++) {
      const t = currentTime + (i / SAMPLE_RATE);
      const sample = signalFn(t);

      // Clamp and convert to 16-bit
      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = Math.floor(clamped * 32767);

      // Write stereo (same for both channels)
      const offset = i * 4;
      buffer.writeInt16LE(int16, offset);     // left
      buffer.writeInt16LE(int16, offset + 2); // right
    }

    currentTime += BUFFER_SIZE / SAMPLE_RATE;
    speaker.write(buffer, writeNextBuffer);
  }

  console.log('Playing Mandelbrot music...');
  writeNextBuffer();
}

// ============================================================================
// RUN IT
// ============================================================================

// Choose one:
// playSignal(mandelbrotExplore, 30);  // Basic exploration
// playSignal(infiniteZoom, 60);       // Infinite zoom journey
playSignal(fractalUniverse, 30);    // Ultimate composition
