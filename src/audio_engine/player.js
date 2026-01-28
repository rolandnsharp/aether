// src/audio_engine/player.js
// ============================================================================
// Player Class - Wraps an f(t) recipe and manages its playback state
// ============================================================================

class Player { // Changed from export class
  constructor(recipe) {
    if (typeof recipe !== 'function') {
      throw new Error('Player recipe must be a function f(t).');
    }
    this.recipe = recipe;
    this.crossfadeVolume = 1.0; // Initial volume, used for crossfading
    this.fadeStartTime = -1; // -1 indicates no fade in progress
    this.targetVolume = 1.0; // Target volume after fade
  }

  // Called by the Conductor for each sample
  // Returns a single sample value (or [left, right] array for stereo)
  update(t) {
    // Apply crossfadeVolume to the recipe's output
    // The recipe itself is a function of time `t`
    const output = this.recipe(t);

    if (typeof output === 'number') {
      return output * this.crossfadeVolume;
    } else if (Array.isArray(output)) {
      // Assuming stereo, apply volume to both channels
      return [output[0] * this.crossfadeVolume, output[1] * this.crossfadeVolume];
    }
    return 0; // Default to silence
  }

  // Method to set crossfade volume (used by the Conductor during fades)
  setCrossfadeVolume(volume) {
    this.crossfadeVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
  }
}

module.exports = { Player }; // New export statement