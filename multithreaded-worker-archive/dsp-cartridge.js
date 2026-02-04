// dsp-cartridge.js - The Persistent DSP Worker
// ============================================================================
// "The Cartridge" - A SINGLE, PERSISTENT worker that lives for the entire
// app lifetime. It receives UPDATE messages to hot-swap signal definitions
// without ever being terminated. This eliminates zombie worker issues.
// ============================================================================

import { STRIDE, SAMPLE_RATE } from './memory.js';

// --- Module-level state for this worker instance ---

// The registry of all active DSP signals provided by the user.
let dspRegistry = new Map();

// TypedArray views into the shared memory.
let stateBuffer, audioBuffer, headTail;
let RING_BUFFER_CAPACITY;

// Control flag for the tick loop
let isRunning = false;

/**
 * The main thread sends messages to control this PERSISTENT worker:
 * - 'INIT': Initialize shared memory views (once on startup)
 * - 'UPDATE': Hot-swap the signal map (on every hot-reload)
 */
self.onmessage = (e) => {
  const { type, signalMap, sabState, sabData, sabIndices } = e.data;

  if (type === 'INIT') {
    console.log('[Cartridge] 🔵 INIT - Initializing shared memory');

    // Set up Shared Memory Views (only once at startup)
    stateBuffer = new Float32Array(sabState);
    audioBuffer = new Float32Array(sabData);
    headTail = new Int32Array(sabIndices);
    RING_BUFFER_CAPACITY = audioBuffer.length / STRIDE;

    console.log(`[Cartridge] Memory initialized: ${RING_BUFFER_CAPACITY} frames`);
    return;
  }

  if (type === 'UPDATE') {
    console.log('[Cartridge] 🔄 UPDATE - Hot-swapping signals');
    console.log(`[Cartridge] Incoming signal count: ${Object.keys(signalMap).length}`);
    console.log(`[Cartridge] Signal names: [${Object.keys(signalMap).join(', ')}]`);

    // Clear the old signal registry
    console.log('[Cartridge] Clearing dspRegistry...');
    dspRegistry.clear();

    // Hydrate new signals from the signal map
    for (const [name, { fnString, idx }] of Object.entries(signalMap)) {
      try {
        console.log(`[Cartridge]   Hydrating "${name}"...`);

        // Hydrate: convert string -> live function
        const dspModule = new Function('mem', 'idx', `return (${fnString})(mem, idx)`)(stateBuffer, idx);

        // Validate and register
        if (dspModule && typeof dspModule.update === 'function') {
          dspRegistry.set(name, dspModule);
          console.log(`[Cartridge]   ✅ "${name}" ready`);
        } else {
          console.error(`[Cartridge]   ❌ "${name}" missing update function`);
        }
      } catch (error) {
        console.error(`[Cartridge]   ❌ "${name}" hydration error:`, error);
      }
    }

    console.log(`[Cartridge] 🎵 Active signals: ${dspRegistry.size}`);
    console.log(`[Cartridge] Registry: [${Array.from(dspRegistry.keys()).join(', ')}]`);

    // Start the tick loop if not already running
    if (!isRunning && dspRegistry.size > 0) {
      console.log('[Cartridge] Starting tick loop...');
      isRunning = true;
      tick();
    } else if (isRunning && dspRegistry.size === 0) {
      console.log('[Cartridge] ⚠️  No signals, but tick loop continues (outputs silence)');
    } else if (!isRunning && dspRegistry.size === 0) {
      console.log('[Cartridge] ⚠️  No signals, tick loop remains stopped');
    } else {
      console.log('[Cartridge] Tick loop running, signals hot-swapped');
    }

    return;
  }
};

/**
 * The core real-time mixing loop.
 * This runs continuously once started, even when dspRegistry is empty
 * (in which case it outputs silence).
 */
function tick() {
  if (!isRunning) {
    console.log('[Cartridge] Tick loop stopped');
    return;
  }

  // A vector to hold the mixed audio frame
  const mixedVector = new Float32Array(STRIDE);

  while (isRunning) {
    const head = Atomics.load(headTail, 0);
    const tail = Atomics.load(headTail, 1);

    // If the ring buffer is full, yield and try again
    if (((head + 1) & (RING_BUFFER_CAPACITY - 1)) === tail) {
      return setTimeout(tick, 0);
    }

    // Reset to silence
    mixedVector.fill(0);

    // Mix all active signals
    for (const dspModule of dspRegistry.values()) {
      const outputVector = dspModule.update(SAMPLE_RATE);
      for (let i = 0; i < STRIDE; i++) {
        mixedVector[i] += outputVector[i] || 0;
      }
    }

    // Apply soft clipping (safety limiter)
    for (let i = 0; i < STRIDE; i++) {
      mixedVector[i] = Math.tanh(mixedVector[i]);
    }

    // Write to shared buffer
    audioBuffer.set(mixedVector, head * STRIDE);

    // Atomically announce the new frame
    Atomics.store(headTail, 0, (head + 1) & (RING_BUFFER_CAPACITY - 1));
  }
}
