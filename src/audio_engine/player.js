// src/audio_engine/player.js
// ============================================================================
// Player Class - Wraps a recipe and manages its playback state.
// It can handle both pure f(t) recipes and compiled, stateful update functions.
// ============================================================================

class Player {
  /**
   * Creates a new Player instance.
   * 
   * @param {function} updateFn - The actual function to execute per sample. This can be:
   *   - A pure `f(t)` function (when `isStateful` is `false`).
   *   - A JIT-compiled stateful function `f(globalState, baseIdx, dt)` (when `isStateful` is `true`).
   * @param {boolean} [isStateful=false] - Flag indicating if `updateFn` expects state parameters or just `t`.
   * @param {function} [originalRecipe=null] - The original user-defined `f(t)` recipe. Stored for
   *                                           memoization and debugging, especially when `updateFn` is JIT-compiled.
   * @param {number} [baseStateIndex=-1] - The starting index in `globalThis.STATE_ARRAY` reserved for this player's state.
   *                                     Only relevant for stateful players. -1 if not applicable.
   */
  constructor(updateFn, isStateful = false, originalRecipe = null, baseStateIndex = -1) {
    if (typeof updateFn !== 'function') {
      throw new Error('Player update function must be a function.');
    }
    this.updateFn = updateFn;
    this.isStateful = isStateful;
    this.recipe = originalRecipe || updateFn; // Store original recipe for inspection/memoization
    this.baseStateIndex = baseStateIndex; // Store player's base state index

    this.crossfadeVolume = 1.0; // Initial volume, used for crossfading during hot-reloads
    this.fadeStartTime = -1;    // `globalThis.CHRONOS` value when fade started (-1 if not fading)
    this.targetVolume = 1.0;    // Target volume (0.0 for fading out, 1.0 for active)
  }

  /**
   * Called by the Conductor for each sample to get its audio output.
   * The arguments passed depend on whether the `updateFn` is stateful or pure `f(t)`.
   * 
   * @param {number} t - The current global time `(globalThis.CHRONOS * globalThis.dt)`.
   *                      Used by non-stateful `f(t)` recipes.
   * @returns {number|Array} A single sample value (mono) or a stereo pair `[left, right]`.
   */
  update(t) {
    let output;
    if (this.isStateful) {
      // For JIT-compiled stateful functions, pass the global state array, 
      // this player's base index, and global dt.
      output = this.updateFn(globalThis.STATE_ARRAY, this.baseStateIndex, globalThis.dt); 
    } else {
      // For pure f(t) recipes, just pass the current global time `t`.
      output = this.updateFn(t);
    }

    if (typeof output === 'number') {
      return output * this.crossfadeVolume;
    } else if (Array.isArray(output)) {
      // Assuming stereo, apply volume to both channels for now.
      // Future versions might handle multi-channel more generically.
      return [output[0] * this.crossfadeVolume, output[1] * this.crossfadeVolume];
    }
    return 0; // Default to silence if output is unexpected
  }

  /**
   * Sets the crossfade volume for this player.
   * @param {number} volume - The target volume (0.0 to 1.0).
   */
  setCrossfadeVolume(volume) {
    this.crossfadeVolume = Math.max(0, Math.min(1, volume)); // Clamp volume between 0 and 1
  }
}

module.exports = { Player };