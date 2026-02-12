import { startStream, config } from './transport.js';
import { ringBuffer } from './storage.js';

// --- High-Performance Configuration ---
const STATE_SIZE = 65536;       // Total slots in the state buffer (Float64Array).
const MAX_SIGNALS = 512;        // Maximum number of concurrent signals.
export const SLOTS_PER_SIGNAL = Math.floor(STATE_SIZE / MAX_SIGNALS);

// --- Global Persistent State ---
// This is the CRITICAL part for hot-reloading. By attaching state to `globalThis`,
// it persists across `bun --hot` re-runs of this script.
globalThis.LEL_STATE ??= new Float64Array(STATE_SIZE);
globalThis.LEL_REGISTRY ??= new Map();
globalThis.LEL_OFFSETS ??= new Map();

const STATE = globalThis.LEL_STATE;
const REGISTRY = globalThis.LEL_REGISTRY;
const OFFSETS = globalThis.LEL_OFFSETS;

// Global listener position, mutable only via `setPosition`.
let position = { x: 0, y: 0, z: 0 };

// --- The 's' Object (The "Universe" context) ---
const s = {
    t: 0,
    dt: 1 / config.SAMPLE_RATE,
    sr: config.SAMPLE_RATE,
    idx: 0, // The index of the current sample in the buffer chunk
    get position() { return position },
    state: null, // This will be a Float64Array subarray for each signal
};

// --- Public API ---
export function register(name, fn) {
    let offset;

    // --- CORE PERSISTENCE LOGIC ---
    if (OFFSETS.has(name)) {
        // Signal already exists (e.g., hot-reload): Reuse its previously assigned offset.
        offset = OFFSETS.get(name);
    } else {
        // New signal: Find a fresh, unused memory slot and claim it permanently.
        let hash = (str => { let h=5381; for(let i=0;i<str.length;i++) h=(h*33)^str.charCodeAt(i); return h>>>0; })(name);
        let attempts = 0;
        let potentialOffset;
        const existingOffsets = new Set(OFFSETS.values());

        do {
            potentialOffset = ((hash + attempts) % MAX_SIGNALS) * SLOTS_PER_SIGNAL;
            attempts++;
            if (attempts > MAX_SIGNALS) {
                console.error(`[FATAL] No available state slots for "${name}". Max signals reached.`);
                return;
            }
        } while (existingOffsets.has(potentialOffset));
        
        offset = potentialOffset;
        OFFSETS.set(name, offset);
        console.log(`[LEL] Allocated new permanent offset ${offset} for "${name}".`);
    }

    const stateSubarray = STATE.subarray(offset, offset + SLOTS_PER_SIGNAL);
    REGISTRY.set(name, { fn, stateObject: stateSubarray }); 
    console.log(`[LEL] Registered function for "${name}".`);
}

export function unregister(name) {
    if (REGISTRY.has(name)) {
        REGISTRY.delete(name);
        console.log(`[LEL] Unregistered function for "${name}".`);
    }
    // Note: We do NOT clear the offset from the OFFSETS map.
    // That mapping is permanent and key to phase-continuous state.
}

export function setPosition(newPosition) {
    position = { ...position, ...newPosition };
}

export function clear(fullReset = false) {
    REGISTRY.clear(); 
    console.log('[LEL] Cleared function registry.');
    if (fullReset) {
        OFFSETS.clear();
        STATE.fill(0);
        console.log('[LEL] Performed full state and offset wipe.');
    }
}

// --- Audio Engine (Producer) ---
const outputBuffer = new Float32Array(config.BUFFER_SIZE * config.STRIDE);

// This function is the core of our producer. It generates one chunk of audio.
function generateAudioChunk() {
    for (let i = 0; i < config.BUFFER_SIZE; i++) {
        let left = 0, right = 0;
        s.t += s.dt;
        s.idx = i;

        for (const { fn, stateObject } of REGISTRY.values()) {
            s.state = stateObject;
            const result = fn(s);
            if (Array.isArray(result)) {
                left += result[0] || 0;
                right += result[1] || 0;
            } else {
                left += result || 0;
                right += result || 0;
            }
        }

        outputBuffer[i * config.STRIDE] = Math.tanh(left);
        outputBuffer[i * config.STRIDE + 1] = Math.tanh(right);
    }
    return outputBuffer;
}

// The producer's only job is to keep the ring buffer full.
function producerLoop() {
    // If there's enough space, generate a new chunk and write it.
    if (ringBuffer.availableSpace() > outputBuffer.length) {
        const chunk = generateAudioChunk();
        ringBuffer.writeChunk(chunk);
    }
    
    // Yield to the event loop, then immediately continue.
    setImmediate(producerLoop);
}

function start() {
    if (globalThis.LEL_ENGINE_INSTANCE) {
        console.log('[LEL] Hot-reload detected: Engine already running.');
        import('./live-session.js');
        return;
    }

    console.log('Starting LEL engine...');
    clear(true); 
    ringBuffer.clear();
    
    // --- Start Producer and Consumer Concurrently ---
    // This is the most robust startup pattern. The consumer may report
    // "Starvation" for a few milliseconds, but the producer will catch
    // up almost instantly, ensuring a reliable start.

    // Start the consumer (reads from buffer to speaker)
    startStream();
    
    // Start the producer (fills the buffer)
    producerLoop();
    
    globalThis.LEL_ENGINE_INSTANCE = { status: 'running' };

    // Load the initial session file.
    import('./live-session.js');
    console.log("Engine running. Loading session file...");
}

start();
