// engine.js - Main Audio Engine Loop
// ============================================================================
// "The Heart" - High-speed sample generation loop
// ============================================================================

import { ringBuffer } from './storage.js';
import { updateAll } from './kanon.js';
import { createTransport } from './transport.js';

// ============================================================================
// Configuration
// ============================================================================

const SAMPLE_RATE = 44100;
const FILL_INTERVAL_MS = 5; // Fill buffer every 5ms (more aggressive)

// ============================================================================
// Engine State
// ============================================================================

let transport = null;
let fillTimerHandle = null;
let isRunning = false;

// ============================================================================
// Producer Loop (Filling the Well)
// ============================================================================

function fillBuffer() {
  if (!isRunning) return;

  // Fill aggressively to prevent underruns
  let filled = 0;
  const targetFill = 2048; // Fill more samples per cycle
  const space = ringBuffer.availableSpace();

  // Fill up to target or available space
  const toFill = Math.min(targetFill, space);

  for (let i = 0; i < toFill; i++) {
    const vector = updateAll(SAMPLE_RATE);
    if (!ringBuffer.write(vector)) break;
    filled++;
  }

  // Warn if buffer is getting low
  const available = ringBuffer.availableData();
  if (available < 1024) {
    console.warn(`[Engine] Buffer low! ${available}/${ringBuffer.size} frames`);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Start the audio engine
 */
export function start() {
  if (isRunning) {
    console.log('[Engine] Already running');
    return;
  }

  console.log('[Engine] Starting audio engine...');

  // Pre-fill buffer before starting transport
  console.log('[Engine] Pre-filling buffer...');
  const preFillTarget = ringBuffer.size * 0.75; // Fill to 75%
  let preFilled = 0;
  while (preFilled < preFillTarget) {
    const vector = updateAll(SAMPLE_RATE);
    if (!ringBuffer.write(vector)) break;
    preFilled++;
  }
  console.log(`[Engine] Pre-filled ${preFilled} frames`);

  // Create transport (speaker.js for now)
  transport = createTransport('PUSH', ringBuffer, SAMPLE_RATE);

  // Start producer loop
  isRunning = true;
  fillTimerHandle = setInterval(fillBuffer, FILL_INTERVAL_MS);

  console.log(`[Engine] Running at ${SAMPLE_RATE}Hz, STRIDE=${ringBuffer.stride}`);
}

/**
 * Stop the audio engine
 */
export function stop() {
  if (!isRunning) return;

  console.log('[Engine] Stopping audio engine...');

  isRunning = false;

  if (fillTimerHandle) {
    clearInterval(fillTimerHandle);
    fillTimerHandle = null;
  }

  if (transport) {
    transport.stop();
    transport = null;
  }

  console.log('[Engine] Stopped');
}

/**
 * Get engine status
 */
export function status() {
  return {
    running: isRunning,
    sampleRate: SAMPLE_RATE,
    stride: ringBuffer.stride,
    bufferSize: ringBuffer.size,
    bufferFill: ringBuffer.availableData(),
    bufferSpace: ringBuffer.availableSpace(),
  };
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGINT', () => {
  console.log('\n[Engine] Received SIGINT, shutting down...');
  stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Engine] Received SIGTERM, shutting down...');
  stop();
  process.exit(0);
});
