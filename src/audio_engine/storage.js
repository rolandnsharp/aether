// src/audio_engine/storage.js
// ============================================================================
// Ring Buffer (The Well) - SharedArrayBuffer for efficient audio data transfer
//
// Refactored for N-Dimensional Audio (Stereo default, expandable to 4+ channels)
// ============================================================================

const FRAME_CAPACITY = 32768; // Total frames (e.g., ~680ms at 48kHz)
const STRIDE = 2;             // N-Dimensional: 2 for Stereo (can be 1 for Mono, 4 for XYZW, etc.)
const BYTES_PER_SAMPLE = Float64Array.BYTES_PER_ELEMENT; // 8 bytes for Float64

// Calculate total size for the SharedArrayBuffer.
// This accounts for FRAME_CAPACITY * STRIDE samples, plus 2 pointers (read/write indices).
const bufferSize = (FRAME_CAPACITY * STRIDE * BYTES_PER_SAMPLE) + (2 * Int32Array.BYTES_PER_ELEMENT);
const sharedBuffer = new SharedArrayBuffer(bufferSize);

// Data view for interleaved samples (e.g., L R L R ...)
// The total length of this array is FRAME_CAPACITY * STRIDE.
const dataBuffer = new Float64Array(sharedBuffer, 0, FRAME_CAPACITY * STRIDE);

// Control view for read/write pointers.
// Pointers are 32-bit integers, stored at the end of the shared buffer.
const controlBuffer = new Int32Array(sharedBuffer, FRAME_CAPACITY * STRIDE * BYTES_PER_SAMPLE, 2);
const READ_PTR_INDEX = 0;
const WRITE_PTR_INDEX = 1;

// Initialize pointers to 0.
Atomics.store(controlBuffer, READ_PTR_INDEX, 0);
Atomics.store(controlBuffer, WRITE_PTR_INDEX, 0);

const ringBuffer = {
  data: dataBuffer,
  control: controlBuffer,
  capacity: FRAME_CAPACITY, // Total number of frames
  stride: STRIDE,           // Number of samples per frame (channels)

  /**
   * Writes a single multi-channel frame (vector of samples) to the ring buffer.
   * The `frame` array should have `STRIDE` elements (e.g., `[left, right]` for stereo).
   * Samples are written interleaved: `data[writeIdx] = frame[0]; data[writeIdx+1] = frame[1];`
   * 
   * @param {Array<number>} frame - An array of `STRIDE` samples for one time point.
   * @returns {boolean} - `true` if write succeeded, `false` if buffer is full.
   */
  write: (frame) => {
    if (frame.length !== STRIDE) {
      console.error(`[RingBuffer] Write frame must have ${STRIDE} channels, got ${frame.length}.`);
      return false;
    }

    const writeIdx = Atomics.load(controlBuffer, WRITE_PTR_INDEX);
    const readIdx = Atomics.load(controlBuffer, READ_PTR_INDEX);

    // Check if buffer is full. We leave one 'empty' frame to distinguish full from empty.
    // (writeIdx + STRIDE) % (capacity * STRIDE) checks if the next write position
    // would overlap with the read position.
    if (((writeIdx + STRIDE) % (FRAME_CAPACITY * STRIDE)) === readIdx) {
      return false; // Buffer is full
    }

    // Write samples interleaved into the dataBuffer.
    // writeIdx is a byte offset, so we add channel index.
    for (let i = 0; i < STRIDE; i++) {
      dataBuffer[writeIdx + i] = frame[i];
    }

    // Update write pointer, wrapping around the buffer.
    Atomics.store(controlBuffer, WRITE_PTR_INDEX, (writeIdx + STRIDE) % (FRAME_CAPACITY * STRIDE));
    return true;
  },

  /**
   * Reads a single multi-channel frame (vector of samples) from the ring buffer.
   * The provided `frame` array will be filled with `STRIDE` elements.
   * If the buffer is empty, the `frame` will be filled with zeros.
   * 
   * @param {Array<number>} frame - An array (pre-allocated) to be filled with `STRIDE` samples.
   * @returns {boolean} - `true` if read succeeded (data was available), `false` if buffer was empty.
   */
  read: (frame) => {
    if (frame.length !== STRIDE) {
      console.error(`[RingBuffer] Read frame must have ${STRIDE} channels, got ${frame.length}.`);
      // Fill with zeros if array is malformed.
      for(let i=0; i < STRIDE; i++) frame[i] = 0;
      return false;
    }

    const writeIdx = Atomics.load(controlBuffer, WRITE_PTR_INDEX);
    const readIdx = Atomics.load(controlBuffer, READ_PTR_INDEX);

    // Check if buffer is empty.
    if (readIdx === writeIdx) {
      // Fill with zeros for underrun
      for (let i = 0; i < STRIDE; i++) frame[i] = 0;
      return false; // Buffer is empty
    }

    // Read samples interleaved from the dataBuffer.
    for (let i = 0; i < STRIDE; i++) {
      frame[i] = dataBuffer[readIdx + i];
    }

    // Update read pointer, wrapping around the buffer.
    Atomics.store(controlBuffer, READ_PTR_INDEX, (readIdx + STRIDE) % (FRAME_CAPACITY * STRIDE));
    return true;
  },

  /**
   * Gets the number of full frames (time points) currently available in the buffer.
   * @returns {number} The count of available frames.
   */
  availableData: () => {
    const writeIdx = Atomics.load(controlBuffer, WRITE_PTR_INDEX);
    const readIdx = Atomics.load(controlBuffer, READ_PTR_INDEX);
    // Calculate data in terms of samples, then divide by STRIDE to get frames.
    let dataSamples = (writeIdx - readIdx + (FRAME_CAPACITY * STRIDE)) % (FRAME_CAPACITY * STRIDE);
    return dataSamples / STRIDE; 
  },

  /**
   * Gets the number of empty frames (time points) available for writing.
   * We always reserve one frame to differentiate full from empty.
   * @returns {number} The count of available empty frames.
   */
  availableSpace: () => {
    return FRAME_CAPACITY - ringBuffer.availableData() - 1;
  },

  // Total buffer capacity in frames.
  size: FRAME_CAPACITY
};

module.exports = { ringBuffer };
