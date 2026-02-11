// lol/index.js - The Performant, Corrected Core

import { ringBuffer, writeToRingBuffer } from './storage.js';
import { initAudio, write as writeAudio, config } from './transport.js';

// --- Configuration ---
const STATE_SIZE = 65536; // Total slots in the overall state buffer (Float64Array).
const MAX_SIGNALS = 512;   // Maximum number of concurrent signals the engine can hold.
export const SLOTS_PER_SIGNAL = Math.floor(STATE_SIZE / MAX_SIGNALS); // How many Float64s each signal gets for its state.

// --- Global Persistent State ---
// These three core structures are stored in `globalThis` to ensure they survive hot-reloads.
globalThis.LOL_STATE ??= new Float64Array(STATE_SIZE);    // The main high-performance memory block for all signal states.
globalThis.LOL_REGISTRY ??= new Map();                      // Holds the currently active signal functions. This is cleared on hot-reload.
globalThis.LOL_OFFSETS ??= new Map();                       // PERMANENT map of signal name -> memory offset. This is the key to persistence.

const STATE = globalThis.LOL_STATE;
const REGISTRY = globalThis.LOL_REGISTRY;
const OFFSETS = globalThis.LOL_OFFSETS; // This is the crucial map that survives hot-reloads.

// Global listener position, mutable only via `setPosition`.
let position = { x: 0, y: 0, z: 0 };

// --- The 's' Object (The "Universe" context) ---
// This single, mutable object instance is passed by reference to every signal function on every sample.
const s = {
    t: 0,
    dt: 1 / config.SAMPLE_RATE,
    sr: config.SAMPLE_RATE,
    get position() { return position },
    // `s.state` will always be the raw Float64Array subarray for direct, performant access.
    state: null, 
};

// --- Public API ---

/**
 * Registers a signal function with a persistent memory slot.
 * This API exclusively uses raw Float64Array subarrays for `s.state`,
 * providing maximum performance. State is accessed via `s.state[0]`, `s.state[1]`, etc.
 * 
 * Future Enhancement: To implement a "pretty" API with named state access (e.g., `s.state.phase`),
 * a Proxy could be created here. The Proxy would map named properties to array indices
 * within `stateSubarray`, providing a more ergonomic interface without sacrificing the
 * underlying Float64Array performance. This would involve an `options.initialState` parameter
 * to define the state shape, and a `createStateProxy` function (similar to previous iterations)
 * to build the proxy.
 *
 * @param {string} name - The unique, persistent name for the signal.
 * @param {function} fn - The signal's rendering function.
 */
export function register(name, fn) {
    let offset;

    // --- CORE PERSISTENCE LOGIC ---
    // This is the CRITICAL part for phase-continuous hot-reloading.
    // We retrieve the signal's assigned memory offset, or allocate a new one if it's a new signal.
    if (OFFSETS.has(name)) {
        // Signal already exists (e.g., hot-reload): Reuse its previously assigned offset.
        offset = OFFSETS.get(name);
    } else {
        // New signal: Find a fresh, unused memory slot and claim it permanently.
        let hash = (str => { let h=5381; for(let i=0;i<str.length;i++) h=(h*33)^str.charCodeAt(i); return h>>>0; })(name);
        let attempts = 0;
        let potentialOffset;
        const existingOffsets = new Set(OFFSETS.values()); // Get all offsets currently in use by other signals.

        // Linear probing: Iterate through potential slots until an empty one is found.
        do {
            potentialOffset = ((hash + attempts) % MAX_SIGNALS) * SLOTS_PER_SIGNAL;
            attempts++;
            if (attempts > MAX_SIGNALS) {
                console.error(`[FATAL] No available state slots for new signal "${name}". Max signals reached.`);
                return;
            }
        } while (existingOffsets.has(potentialOffset));
        
        offset = potentialOffset;
        OFFSETS.set(name, offset); // Permanently assign this offset to the signal name.
        console.log(`[LOL] Allocated new permanent offset ${offset} for "${name}".`);
    }

    // --- STATE PREPARATION (Performant Path Only) ---
    // `s.state` will be the raw Float64Array subarray for direct, high-performance index access.
    const stateSubarray = STATE.subarray(offset, offset + SLOTS_PER_SIGNAL);
    
    // Set the function and its state object in the registry. This is overwritten on every hot-reload.
    REGISTRY.set(name, { fn, stateObject: stateSubarray }); 
    console.log(`[LOL] Registered function for "${name}".`);
}

export function setPosition(newPosition) {
    position = { ...position, ...newPosition };
}

/**
 * Clears engine components.
 * @param {boolean} [fullReset=false] - If true, wipes ALL engine state including persistent offsets and state memory.
 */
export function clear(fullReset = false) {
    REGISTRY.clear(); // Always clear the function registry.
    console.log('[LOL] Cleared function registry.');
    if (fullReset) {
        OFFSETS.clear();   // Wipe the permanent mapping of signal names to memory offsets.
        STATE.fill(0);     // Zero out the entire high-performance state buffer.
        console.log('[LOL] Performed full state and offset wipe.');
    }
}

// --- Audio Engine ---
const outputBuffer = new Float32Array(config.BUFFER_SIZE * config.STRIDE);

function processAudio() {
    for (let i = 0; i < config.BUFFER_SIZE; i++) {
        let left = 0, right = 0;
        s.t += s.dt;

        for (const { fn, stateObject } of REGISTRY.values()) {
            s.state = stateObject; // `stateObject` is now always the raw Float64Array subarray.
            const result = fn(s);
            if (Array.isArray(result)) {
                left += result[0] || 0;
                right += result[1] || 0;
            } else {
                left += result || 0;
                right += result || 0;
            }
        }
        
        if (REGISTRY.size > 1) {
            left /= REGISTRY.size;
            right /= REGISTRY.size;
        }

        outputBuffer[i * config.STRIDE] = Math.tanh(left);
        outputBuffer[i * config.STRIDE + 1] = Math.tanh(right);
    }
    writeToRingBuffer(outputBuffer);
    writeAudio(outputBuffer);
}

// --- Initialization & Hot-Reloading ---
function start() {
    console.log('Starting LOL engine...');
    clear(true); // Perform a full reset on cold start to ensure a clean slate.
    initAudio();
    setInterval(processAudio, (config.BUFFER_SIZE / config.SAMPLE_RATE) * 1000);
    console.log("Engine started. Loading session file...");
    import('./live-session.js');
}

if (import.meta.hot) {
    import.meta.hot.accept('./live-session.js', () => {
        console.log('Hot-reloading live-session.js...');
        // Correctly clear only the functions, preserving state and offsets.
        // This is the key to fixing the hot-reload bugs.
        REGISTRY.clear();
        import('./live-session.js');
    });
}

start();
