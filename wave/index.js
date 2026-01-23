import { createJackClient } from './jack-backend.js';

// Wave registry for named functions (hot reload support)
const registry = new Map();

// Audio configuration
const SAMPLE_RATE = 48000;
const CHANNELS = 2;  // Stereo

// Global time tracker
let currentTime = 0;

// JACK audio client
let jackClient = null;
let isPlaying = false;

// ============================================================================
// CORE WAVE FUNCTION
// ============================================================================

function wave(name, fn) {
  // Auto-start audio on first wave
  if (!isPlaying) {
    startAudio();
  }

  // Register the wave function
  registry.set(name, fn);

  return fn;
}

// ============================================================================
// REGISTRY MANAGEMENT
// ============================================================================

wave.list = function() {
  return Array.from(registry.keys());
};

wave.remove = function(name) {
  registry.delete(name);
};

wave.clear = function() {
  registry.clear();
};

// ============================================================================
// AUDIO OUTPUT
// ============================================================================

function startAudio() {
  if (isPlaying) return;

  console.log('Starting audio...');
  console.log(`Backend: JACK via Bun FFI`);
  console.log(`Routing: JACK -> PipeWire`);

  // Create JACK client with audio callback
  jackClient = createJackClient('wave', (bufferL, bufferR, nframes) => {
    fillBuffer(bufferL, bufferR, nframes);
  });

  console.log(`Sample Rate: ${jackClient.sampleRate} Hz`);
  console.log(`Channels: ${CHANNELS}`);

  isPlaying = true;
  currentTime = 0;

  // Activate JACK client
  jackClient.start();
  console.log('Audio started!');
}

function fillBuffer(bufferL, bufferR, nframes) {
  const dt = 1 / jackClient.sampleRate;

  for (let i = 0; i < nframes; i++) {
    const t = currentTime + (i * dt);

    // Mix all registered waves
    let leftSample = 0;
    let rightSample = 0;

    for (const fn of registry.values()) {
      const output = fn(t);

      if (typeof output === 'number') {
        // Mono signal - add to both channels
        leftSample += output;
        rightSample += output;
      } else if (Array.isArray(output)) {
        // Stereo signal [left, right]
        leftSample += output[0];
        rightSample += output[1];
      }
    }

    // Clamp to [-1, 1]
    leftSample = Math.max(-1, Math.min(1, leftSample));
    rightSample = Math.max(-1, Math.min(1, rightSample));

    // Write to separate channel buffers (32-bit float)
    bufferL[i] = leftSample;
    bufferR[i] = rightSample;
  }

  // Update global time
  currentTime += nframes * dt;
}

function stopAudio() {
  if (!isPlaying) return;

  console.log('Stopping audio...');
  isPlaying = false;

  if (jackClient) {
    jackClient.close();
    jackClient = null;
  }
}

wave.stopAudio = stopAudio;

// Handle cleanup on exit
process.on('SIGINT', () => {
  stopAudio();
  process.exit(0);
});

// ============================================================================
// EXPORTS
// ============================================================================

export default wave;
