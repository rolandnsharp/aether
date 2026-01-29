// src/index.js
// ============================================================================
// Kanon Core - Symbolic JIT Compiler, Registry, and Engine Orchestration
//
// This module serves as the primary user interface for Kanon. It acts as the
// orchestrator for the entire audio engine, managing player registration,
// JIT compilation, state allocation, and lifecycle.
// ============================================================================

const { Conductor } = require('./audio_engine/engine.js');
const { Player } = require('./audio_engine/player.js');
const { createTransport } = require('./audio_engine/transport.js');
const { trace } = require('./audio_engine/tracer.js');
const { compile } = require('./audio_engine/compiler.js');
const { t, literal, add, mul, sin, pow } = require('./audio_engine/symbolic.js'); // Import all symbolic helpers

// --- Player State Management ---
// Total size of the global state array (all players combined)
const MAX_TOTAL_STATE_SLOTS = 1024; // Arbitrary initial size, can be tuned.
// Each player gets a fixed block of state slots to ensure stability.
const SLOTS_PER_PLAYER = 16; // As per proposal: enough for complex FM/additive patches.

// Global SharedArrayBuffer for all player states. Survives hot-reloads.
// `globalThis.STATE_ARRAY` is used by compiled players directly.
globalThis.STATE_ARRAY = new Float64Array(new SharedArrayBuffer(MAX_TOTAL_STATE_SLOTS * Float64Array.BYTES_PER_ELEMENT));

// Map to assign stable base indices for each Kanon ID.
const idToBaseIndex = new Map(); // Maps kanon ID (string) -> baseStateIndex (number)
let nextAvailableStateIndex = 0; // Tracks the next free block in STATE_ARRAY

// --- Compiler Cache for memoization ---
// Maps recipe.toString() -> Player instance (compiled or f(t) fallback).
const playerCache = new Map(); 
// Maps player ID -> recipe.toString(). Used to find if a recipe has changed.
const idToRecipeString = new Map();

// ============================================================================
// CORE KANON FUNCTION (The Symbolic JIT Compiler and Player Registry)
// ============================================================================
/**
 * Registers and/or compiles an audio recipe, making it available for playback.
 * This is the primary user-facing function of the Kanon library.
 * 
 * @param {string} id - A unique identifier for the recipe (e.g., 'sine', 'fm-vortex').
 * @param {function} recipe - The user-defined `f(t)` function, typically written
 *                            using the `kanon.t`, `kanon.sin`, etc. symbolic helpers.
 * @returns {function} The original recipe function (for chaining or inspection).
 */
function kanon(id, recipe) {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Player ID must be a non-empty string.');
  }
  if (typeof recipe !== 'function') {
    throw new Error('Recipe must be a function f(t).');
  }

  // --- Stable State Allocation for this Player ID ---
  // Each ID gets a persistent block of 16 slots in `globalThis.STATE_ARRAY`.
  let baseStateIndex = idToBaseIndex.get(id);
  if (baseStateIndex === undefined) {
    // Allocate a new block of state slots if this ID is new.
    if (nextAvailableStateIndex + SLOTS_PER_PLAYER > MAX_TOTAL_STATE_SLOTS) {
      console.error(`[Kanon] Ran out of global state slots! Max: ${MAX_TOTAL_STATE_SLOTS}. Increase MAX_TOTAL_STATE_SLOTS.`);
      // Fallback: If we run out, assign a temporary, potentially overlapping index.
      // This is a graceful degradation but indicates an architectural limit.
      baseStateIndex = nextAvailableStateIndex % (MAX_TOTAL_STATE_SLOTS - SLOTS_PER_PLAYER + 1); 
    } else {
      baseStateIndex = nextAvailableStateIndex;
      nextAvailableStateIndex += SLOTS_PER_PLAYER;
    }
    idToBaseIndex.set(id, baseStateIndex);
    console.log(`[Kanon] Allocated state for ID '${id}' at base index: ${baseStateIndex}`);
  }

  // --- Memoization & JIT Compilation ---
  // Check if this exact recipe (by source code) has been seen before.
  const recipeString = recipe.toString();
  let player = playerCache.get(recipeString);

  if (!player) {
    // Recipe is new or modified. Attempt to trace and compile it.
    try {
      // Step 1: Trace the recipe into an Abstract Syntax Tree (AST).
      const ast = trace(recipe);

      // Step 2: Compile the AST into a stateful, high-performance `update()` function.
      // The compiler receives the AST and the player's base state index.
      const statefulUpdate = compile(ast, baseStateIndex); // Pass baseStateIndex to compiler

      // Step 3: Create a new Player instance, explicitly marked as stateful.
      player = new Player(statefulUpdate, true, recipe, baseStateIndex);
      console.log(`[Kanon] Successfully JIT-compiled recipe ID: ${id}. Using stateful player.`);

    } catch (err) {
      // Fallback: If tracing or compilation fails (e.g., unsupported operators),
      // create a Player that directly executes the original `f(t)` recipe.
      console.warn(`[Kanon] Could not JIT-compile recipe ID: '${id}'. Reason: ${err.message}. Falling back to pure f(t) mode.`);
      player = new Player(recipe, false, recipe, baseStateIndex);
    }

    // Cache the newly created player (whether JIT-compiled or f(t) fallback).
    playerCache.set(recipeString, player);
  } else {
    console.log(`[Kanon] Reusing player from cache for recipe ID: '${id}'.`);
    // If reusing a player, ensure its baseStateIndex is updated in case it moved
    // (e.g., if a previous recipe took less state and a new one took more, forcing re-allocation)
    player.baseStateIndex = baseStateIndex;
  }

  // Track which recipe string is currently associated with this ID.
  // This helps detect changes on hot-reload.
  idToRecipeString.set(id, recipeString);

  // Tell the Conductor to use this player for this ID.
  // The Conductor handles crossfading if an old player for this ID already exists.
  Conductor.setPlayer(id, player);

  return player.recipe; // Return the original recipe for chaining or inspection.
}

// ============================================================================
// Symbolic Library Exposure
// 
// Expose the symbolic building blocks directly on the `kanon` object for
// convenient recipe definition (e.g., `kanon.sin(kanon.mul(kanon.t, 440))`).
// ============================================================================
kanon.t = t;
kanon.literal = literal;
kanon.add = add;
kanon.mul = mul;
kanon.sin = sin;
kanon.pow = pow;

// ============================================================================
// Engine Control & Registry Management (Delegated to Conductor)
// ============================================================================

/**
 * Boots the audio engine (Conductor and Transport). Idempotent.
 * This should be called once after all initial recipes are registered.
 */
kanon.boot = function() {
  if (Conductor.status().running) return; // Boot only once if not already running.
  
  // The SAMPLE_RATE is set globally by engine.js.
  const transportInstance = createTransport('PUSH', globalThis.SAMPLE_RATE);
  Conductor.start(transportInstance);
};

/**
 * Lists the IDs of all currently active players.
 * @returns {Array<string>} An array of player IDs.
 */
kanon.list = () => Array.from(Conductor.status().activePlayers.keys());

/**
 * Removes a player by its ID. It will be gracefully faded out by the Conductor.
 * @param {string} id - The ID of the player to remove.
 */
kanon.remove = (id) => {
  Conductor.removePlayer(id);
  idToRecipeString.delete(id);
};

/**
 * Clears all active players, the compiler cache, and resets state allocation.
 */
kanon.clear = () => {
  Conductor.clearPlayers();
  playerCache.clear();
  idToRecipeString.clear();
  // Also reset state allocation for a clean slate.
  nextAvailableStateIndex = 0;
  idToBaseIndex.clear();
  // Clear global state array (fill with zeros)
  globalThis.STATE_ARRAY.fill(0);
};

/**
 * Stops the entire audio engine.
 */
kanon.stopAudio = () => {
  Conductor.stop();
  playerCache.clear();
  idToRecipeString.clear();
  nextAvailableStateIndex = 0;
  idToBaseIndex.clear();
  globalThis.STATE_ARRAY.fill(0);
};

module.exports = kanon; // Export the primary kanon interface.