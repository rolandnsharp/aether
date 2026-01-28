// src/audio_engine/engine.js
// ============================================================================
// Conductor (engine.js) - Manages Players, fills Ring Buffer, and controls clock
// ============================================================================

const { ringBuffer } = require('./storage.js');
const { Player } = require('./player.js');

// --- Configuration Constants ---
const SAMPLE_RATE = 44100; // Hardcoded for Phase 1 as per proposal
const CHANNELS = ringBuffer.stride; // Currently 1 (Mono)
const FADE_DURATION_MS = 10;
const FADE_DURATION_SAMPLES = (FADE_DURATION_MS / 1000) * SAMPLE_RATE;

// --- Global State ---
globalThis.CHRONOS = 0; // Global sample counter (Float64)
globalThis.SAMPLE_RATE = SAMPLE_RATE; // Expose for recipes if needed
globalThis.dt = 1 / SAMPLE_RATE;

let isRunning = false;
let transport = null;

// --- Player Management ---
const activePlayers = new Map();      // Players currently generating sound
const fadingOutPlayers = new Map();   // Players that are fading out

// --- Conductor Core ---
/**
 * Main audio generation loop. Fills the ring buffer.
 */
function fillBufferLoop() {
  if (!isRunning) return;

  const framesPerCycle = 128;
  const toFill = Math.min(framesPerCycle, ringBuffer.availableSpace());

  for (let i = 0; i < toFill; i++) {
    let mixedSample = 0;
    const currentT = globalThis.CHRONOS * globalThis.dt;

    for (const player of activePlayers.values()) {
      mixedSample += player.update(currentT);
    }

    for (const [id, player] of fadingOutPlayers.entries()) {
      mixedSample += player.update(currentT);
      const fadeProgress = (globalThis.CHRONOS - player.fadeStartTime) / FADE_DURATION_SAMPLES;
      const newVolume = Math.max(0, 1 - fadeProgress);
      player.setCrossfadeVolume(newVolume);
      if (newVolume <= 0) {
        fadingOutPlayers.delete(id);
      }
    }

    mixedSample = Math.tanh(mixedSample);

    if (!ringBuffer.write([mixedSample])) {
      // This can happen if the buffer is full, which is expected.
    }

    globalThis.CHRONOS++;
  }

  // Schedule the next cycle.
  // Using setTimeout(..., 1) instead of setImmediate() is a crucial tweak.
  // setImmediate can be too aggressive, causing the producer to spin in a tight
  // busy-wait loop when the buffer is full. This starves the event loop and can
  // cause audio glitches (choppiness). setTimeout(..., 1) yields the CPU
  // more gracefully, giving the consumer (audio hardware) time to run.
  setTimeout(fillBufferLoop, 1);
}

/**
 * Public API for the Conductor (Engine)
 */
const Conductor = {
  start: (transportInstance) => {
    if (isRunning) {
      console.log('[Engine] Conductor already running.');
      return;
    }
    transport = transportInstance;
    isRunning = true;
    globalThis.CHRONOS = 0;

    console.log(`[Engine] Conductor starting at ${SAMPLE_RATE}Hz. Fade duration: ${FADE_DURATION_MS}ms.`);

    const preFillTargetFrames = ringBuffer.capacity * 0.75;
    let preFilledFrames = 0;
    while (preFilledFrames < preFillTargetFrames) {
        let mixedSample = 0;
        const currentT = globalThis.CHRONOS * globalThis.dt;
        for (const player of activePlayers.values()) {
            mixedSample += player.update(currentT);
        }
        mixedSample = Math.tanh(mixedSample);
        if (!ringBuffer.write([mixedSample])) break;
        globalThis.CHRONOS++;
        preFilledFrames++;
    }
    console.log(`[Engine] Pre-filled ${preFilledFrames} frames to ring buffer.`);

    transport.start();
    // Use setTimeout for the first call as well for consistency.
    setTimeout(fillBufferLoop, 1);
  },

  stop: () => {
    if (!isRunning) return;
    isRunning = false;
    if (transport) {
      transport.stop();
      transport = null;
    }
    console.log('[Engine] Conductor stopped.');
  },

  setPlayer: (id, newPlayer) => {
    if (!(newPlayer instanceof Player)) {
      throw new Error('setPlayer expects an instance of Player.');
    }
    const oldPlayer = activePlayers.get(id);
    if (oldPlayer) {
      oldPlayer.fadeStartTime = globalThis.CHRONOS;
      oldPlayer.targetVolume = 0;
      fadingOutPlayers.set(id, oldPlayer);
    }
    newPlayer.setCrossfadeVolume(1);
    activePlayers.set(id, newPlayer);
  },

  removePlayer: (id) => {
    const playerToRemove = activePlayers.get(id);
    if (playerToRemove) {
      playerToRemove.fadeStartTime = globalThis.CHRONOS;
      playerToRemove.targetVolume = 0;
      fadingOutPlayers.set(id, playerToRemove);
      activePlayers.delete(id);
    }
  },

  clearPlayers: () => {
    activePlayers.clear();
    fadingOutPlayers.clear();
  },

  status: () => ({
    running: isRunning,
    chronos: globalThis.CHRONOS,
    sampleRate: SAMPLE_RATE,
    activePlayers: activePlayers,
    fadingOutPlayers: fadingOutPlayers,
    ringBuffer: {
      capacity: ringBuffer.capacity,
      data: ringBuffer.availableData(),
      space: ringBuffer.availableSpace()
    }
  })
};

module.exports = { Conductor };
