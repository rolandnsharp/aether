// src/index.js
// ============================================================================
// Kanon Core - Compiler, Registry, and Engine Orchestration
// ============================================================================

const { Conductor } = require('./audio_engine/engine.js');
const { Player } = require('./audio_engine/player.js');
const { createTransport } = require('./audio_engine/transport.js');

// --- Compiler Cache for memoization ---
const playerCache = new Map(); // Maps recipe.toString() -> Player instance
const idToRecipeString = new Map(); // Maps player ID -> recipe.toString()

// ============================================================================
// CORE KANON FUNCTION (The Compiler)
// ============================================================================
function kanon(id, recipe) {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Player ID must be a non-empty string.');
  }
  if (typeof recipe !== 'function') {
    throw new Error('Recipe must be a function f(t).');
  }

  // --- Memoization ---
  const recipeString = recipe.toString();
  let player = playerCache.get(recipeString);

  if (!player) {
    // Recipe has not been seen before, create new Player and cache it
    player = new Player(recipe);
    playerCache.set(recipeString, player);
    console.log(`[Compiler] New player created for recipe ID: ${id}`);
  } else {
    console.log(`[Compiler] Reusing player from cache for recipe ID: ${id}`);
  }

  // Keep track of which recipe string is associated with this ID
  idToRecipeString.set(id, recipeString);

  // Tell Conductor to use this player for this ID.
  // Conductor handles crossfading if an old player for this ID existed.
  Conductor.setPlayer(id, player);

  return player.recipe; // Return the original recipe for chaining/inspection
}

// ============================================================================
// REGISTRY MANAGEMENT (Delegated to Conductor)
// ============================================================================

kanon.boot = function() {
  if (Conductor.status().running) return; // Boot only once
  // globalThis.SAMPLE_RATE is set in engine.js
  const transportInstance = createTransport('PUSH', globalThis.SAMPLE_RATE);
  Conductor.start(transportInstance);
};

kanon.list = function() {
  return Array.from(Conductor.status().activePlayers.keys());
};

kanon.remove = function(id) {
  Conductor.removePlayer(id);
  // No need to remove from playerCache, as another ID might still use it.
  // Only remove idToRecipeString mapping.
  idToRecipeString.delete(id);
};

kanon.clear = function() {
  Conductor.clearPlayers();
  playerCache.clear(); // Clear all cached players
  idToRecipeString.clear(); // Clear mapping
};

// ============================================================================
// AUDIO CONTROL (Delegated to Conductor)
// ============================================================================

kanon.stopAudio = function() {
  Conductor.stop();
  playerCache.clear(); // Clear all cached players on stop
  idToRecipeString.clear();
};

// ============================================================================
// Exports
// ============================================================================

module.exports = kanon; // Export the compiler as the main kanon interface