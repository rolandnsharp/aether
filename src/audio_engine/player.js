// src/audio_engine/player.js
// ============================================================================
// Player Class - Wraps a recipe and manages its playback state.
// Refactored for N-Dimensional Audio. The `update` method now consistently
// returns a vector of `STRIDE` length.
// ============================================================================

const { ringBuffer } = require('./storage.js');
const STRIDE = ringBuffer.stride;

class Player {
  constructor(updateFn, isStateful = false, originalRecipe = null, baseStateIndex = -1) {
    if (typeof updateFn !== 'function') {
      throw new Error('Player update function must be a function.');
    }
    this.updateFn = updateFn;
    this.isStateful = isStateful;
    this.recipe = originalRecipe || updateFn;
    this.baseStateIndex = baseStateIndex;

    this.crossfadeVolume = 1.0;
    this.fadeStartTime = -1;
    this.targetVolume = 1.0;
  }

  /**
   * Called by the Conductor for each sample. Always returns a vector of STRIDE length.
   * @param {number} t - The current global time from the CHRONOS clock.
   * @returns {Array<number>} A vector of samples (e.g., `[L, R]` for stereo).
   */
  update(t) {
    let output;
    if (this.isStateful) {
      output = this.updateFn(globalThis.STATE_ARRAY, this.baseStateIndex, globalThis.dt);
    } else {
      output = this.updateFn(t);
    }

    const finalFrame = new Array(STRIDE);

    if (typeof output === 'number') {
      // --- Auto-Upmix Mono to N-channel ---
      const sample = output * this.crossfadeVolume;
      for (let i = 0; i < STRIDE; i++) {
        finalFrame[i] = sample;
      }
    } else if (Array.isArray(output) && output.length === STRIDE) {
      // --- Per-Channel Volume for N-channel signal ---
      for (let i = 0; i < STRIDE; i++) {
        finalFrame[i] = (output[i] || 0) * this.crossfadeVolume; // Add guard for NaN/undefined
      }
    } else {
      // If the output is invalid, return silence for all channels.
      for (let i = 0; i < STRIDE; i++) {
        finalFrame[i] = 0;
      }
    }
    
    return finalFrame;
  }

  setCrossfadeVolume(volume) {
    this.crossfadeVolume = Math.max(0, Math.min(1, volume));
  }
}

module.exports = { Player };