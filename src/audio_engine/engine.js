// src/audio_engine/engine.js
// ='use strict';
// ============================================================================
// Conductor (engine.js) - Manages Players, fills Ring Buffer, and controls clock
//
// Refactored for N-Dimensional Audio. The mixing loop now performs vector addition.
// ============================================================================

const { ringBuffer } = require('./storage.js');
const { Player } = require('./player.js');

// --- Configuration Constants ---
const SAMPLE_RATE = 48000;
const STRIDE = ringBuffer.stride; // Get STRIDE from storage.
const FADE_DURATION_MS = 10;
const FADE_DURATION_SAMPLES = (FADE_DURATION_MS / 1000) * SAMPLE_RATE;

// --- Global State ---
globalThis.CHRONOS = 0;
globalThis.SAMPLE_RATE = SAMPLE_RATE;
globalThis.dt = 1 / SAMPLE_RATE;

let isRunning = false;
let transport = null;

// --- Player Management ---
const activePlayers = new Map();
const fadingOutPlayers = new Map();

// --- Conductor Core ---
/**
 * Main audio generation loop. Fills the ring buffer.
 */
function fillBufferLoop() {
  if (!isRunning) return;

  const framesPerCycle = 2048;
  const toFill = Math.min(framesPerCycle, ringBuffer.availableSpace());

  // Pre-allocate a vector for mixing to avoid GC churn in the hot loop.
  const mixedFrame = new Array(STRIDE).fill(0);

  for (let i = 0; i < toFill; i++) {
    // Reset mix vector for each new frame.
    for (let c = 0; c < STRIDE; c++) mixedFrame[c] = 0;

    const currentT = globalThis.CHRONOS * globalThis.dt;

    // --- Vector Addition for Active Players ---
    for (const player of activePlayers.values()) {
      const playerFrame = player.update(currentT); // Player returns a vector [L, R, ...]
      for (let c = 0; c < STRIDE; c++) {
        mixedFrame[c] += playerFrame[c];
      }
    }

    // --- Vector Addition for Fading Out Players ---
    for (const [id, player] of fadingOutPlayers.entries()) {
      const playerFrame = player.update(currentT);
      for (let c = 0; c < STRIDE; c++) {
        mixedFrame[c] += playerFrame[c];
      }

      const fadeProgress = (globalThis.CHRONOS - player.fadeStartTime) / FADE_DURATION_SAMPLES;
      const newVolume = Math.max(0, 1 - fadeProgress);
      player.setCrossfadeVolume(newVolume);
      if (newVolume <= 0) {
        fadingOutPlayers.delete(id);
      }
    }

    // --- Per-Channel Soft Clipping ---
    for (let c = 0; c < STRIDE; c++) {
      mixedFrame[c] = Math.tanh(mixedFrame[c]);
    }

    if (!ringBuffer.write(mixedFrame)) {
      // Buffer full, expected.
    }

    globalThis.CHRONOS++;
  }

  setImmediate(fillBufferLoop);
}

const Conductor = {
  start: (transportInstance) => {
    if (isRunning) return;
    transport = transportInstance;
    isRunning = true;
    globalThis.CHRONOS = 0;

    console.log(`[Engine] Conductor starting at ${SAMPLE_RATE}Hz. STRIDE=${STRIDE}. Fade duration: ${FADE_DURATION_MS}ms.`);

    // --- Pre-fill loop adapted for vector math ---
    const preFillTargetFrames = ringBuffer.capacity * 0.75;
    const mixedFrame = new Array(STRIDE);
    for (let i = 0; i < preFillTargetFrames; i++) {
      for (let c = 0; c < STRIDE; c++) mixedFrame[c] = 0;
      const currentT = globalThis.CHRONOS * globalThis.dt;
      for (const player of activePlayers.values()) {
        const playerFrame = player.update(currentT);
        for (let c = 0; c < STRIDE; c++) {
          mixedFrame[c] += playerFrame[c];
        }
      }
      for (let c = 0; c < STRIDE; c++) {
        mixedFrame[c] = Math.tanh(mixedFrame[c]);
      }
      if (!ringBuffer.write(mixedFrame)) break;
      globalThis.CHRONOS++;
    }
    console.log(`[Engine] Pre-filled ${preFillTargetFrames} frames to ring buffer.`);

    transport.start();
    setImmediate(fillBufferLoop);
  },
  
  // ... (stop, setPlayer, removePlayer, clearPlayers, status remain the same) ...
  stop: () => {
    if (!isRunning) return;
    isRunning = false;
    if (transport) transport.stop();
    transport = null;
    console.log('[Engine] Conductor stopped.');
  },
  setPlayer: (id, newPlayer) => {
    if (!(newPlayer instanceof Player)) throw new Error('setPlayer expects an instance of Player.');
    const oldPlayer = activePlayers.get(id);
    if (oldPlayer) {
      oldPlayer.fadeStartTime = globalThis.CHRONOS;
      fadingOutPlayers.set(id, oldPlayer);
    }
    newPlayer.setCrossfadeVolume(1);
    activePlayers.set(id, newPlayer);
  },
  removePlayer: (id) => {
    const playerToRemove = activePlayers.get(id);
    if (playerToRemove) {
      playerToRemove.fadeStartTime = globalThis.CHRONOS;
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