// memory.js - The Shared Memory Foundation
// ============================================================================
// This file is the single source of truth for all SharedArrayBuffer (SAB)
// allocations. Centralizing memory management makes the overall architecture
// cleaner and easier to understand. These buffers are the bridge that allows
// the main thread (Conductor) and the worker thread (Cartridge) to
// communicate with zero latency.
// ============================================================================

// ============================================================================
// Core Audio Configuration
// ============================================================================

/**
 * The dimensional count of our signal universe.
 * STRIDE = 1 for Mono
 * STRIDE = 2 for Stereo
 * This value dictates the size of vectors returned from DSP functions and
 * how the mixer and hardware pump operate.
 */
export const STRIDE = 2; // Let's build for Stereo from the start.

/**
 * The sample rate for the entire engine. 44.1kHz is the CD-quality standard.
 */
export const SAMPLE_RATE = 44100;

// ============================================================================
// Buffer Capacity Configuration
// ============================================================================

/**
 * The capacity of the audio ring buffer, in frames.
 * This buffer provides the "runway" for the Shadow-Fading engine. A larger
 * buffer allows for more time to swap workers without an underrun (glitch).
 * MUST be a power of 2 for fast, lock-free bitwise wrapping.
 * 8192 frames = ~185ms of audio @ 44.1kHz.
 */
const RING_BUFFER_CAPACITY = 8192;

/**
 * The total number of persistent state slots available to all flux signals.
 * Each signal can claim a few of these slots to store things like phase.
 * This state is preserved across hot-reloads.
 */
const STATE_BUFFER_SLOTS = 1024;

// ============================================================================
// Shared Memory Allocation
// ============================================================================

// These buffers are allocated only once when the application starts. They
// persist in the main thread's memory across all hot-reloads.

/**
 * Shared buffer for the ring buffer's Head/Tail indices.
 * - Index 0: `head` - Where the worker will write the NEXT frame.
 * - Index 1: `tail` - Where the main thread will read the NEXT frame.
 */
export const sabIndices = new SharedArrayBuffer(8); // 2 x Int32

/**
 * Shared buffer for the ring buffer's audio data.
 * This is where the interleaved audio samples (e.g., [L, R, L, R, ...])
 * are stored as 32-bit floating point numbers.
 */
export const sabData = new SharedArrayBuffer(RING_BUFFER_CAPACITY * STRIDE * 4); // Float32

/**
 * Shared buffer for the DSP's persistent state.
 * This is the "memory" in `flux('name', (mem, idx) => ...)`.
 */
export const sabState = new SharedArrayBuffer(STATE_BUFFER_SLOTS * 4); // Float32

// ============================================================================
// TypedArray Views
// ============================================================================

// These are the views that the main thread and worker will use to access the
// raw memory allocated above in a structured way.

/**
 * An Int32 view into `sabIndices` for thread-safe atomic operations.
 */
export const headTail = new Int32Array(sabIndices);

/**
 * A Float32 view into `sabData`, representing the audio ring buffer itself.
 */
export const audioBuffer = new Float32Array(sabData);

/**
 * A Float32 view into `sabState`, representing the persistent memory bank.
 */
export const stateBuffer = new Float32Array(sabState);


<system-reminder>
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
</system-reminder>
