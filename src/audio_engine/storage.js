// src/audio_engine/storage.js
// ============================================================================
// Ring Buffer (The Well) - SharedArrayBuffer for efficient audio data transfer
// ============================================================================

const FRAME_CAPACITY = 16384; // 16,384 frames
const STRIDE = 1;             // Mono for Phase 1
const BYTES_PER_SAMPLE = Float64Array.BYTES_PER_ELEMENT; // 8 bytes for Float64

// Create the SharedArrayBuffer
// Each frame has STRIDE samples, each sample is BYTES_PER_SAMPLE
// We also need space for read and write pointers (two 32-bit integers)
const bufferSize = (FRAME_CAPACITY * STRIDE * BYTES_PER_SAMPLE) + (2 * Int32Array.BYTES_PER_ELEMENT);
const sharedBuffer = new SharedArrayBuffer(bufferSize);

// Data view for samples
const dataBuffer = new Float64Array(sharedBuffer, 0, FRAME_CAPACITY * STRIDE);

// Control view for read/write pointers
// Pointers are 32-bit integers, located after the Float64 data
const controlBuffer = new Int32Array(sharedBuffer, FRAME_CAPACITY * STRIDE * BYTES_PER_SAMPLE, 2);
const READ_PTR_INDEX = 0;
const WRITE_PTR_INDEX = 1;

// Initialize pointers
Atomics.store(controlBuffer, READ_PTR_INDEX, 0);
Atomics.store(controlBuffer, WRITE_PTR_INDEX, 0);

const ringBuffer = { // Changed from export const
  data: dataBuffer,
  control: controlBuffer,
  capacity: FRAME_CAPACITY,
  stride: STRIDE,

  // Write a frame (vector of samples) to the buffer
  // `frame` is expected to be an array-like object of length STRIDE
  write: (frame) => {
    const writeIdx = Atomics.load(controlBuffer, WRITE_PTR_INDEX);
    const readIdx = Atomics.load(controlBuffer, READ_PTR_INDEX);

    // Check if buffer is full (one slot always left empty to distinguish full/empty)
    if (((writeIdx + STRIDE) % (FRAME_CAPACITY * STRIDE)) === readIdx) {
      return false; // Buffer is full, cannot write
    }

    for (let i = 0; i < STRIDE; i++) {
      dataBuffer[writeIdx + i] = frame[i];
    }

    Atomics.store(controlBuffer, WRITE_PTR_INDEX, (writeIdx + STRIDE) % (FRAME_CAPACITY * STRIDE));
    return true;
  },

  // Read a frame (vector of samples) from the buffer
  // `frame` is expected to be an array-like object of length STRIDE, to be filled
  read: (frame) => {
    const writeIdx = Atomics.load(controlBuffer, WRITE_PTR_INDEX);
    const readIdx = Atomics.load(controlBuffer, READ_PTR_INDEX);

    // Check if buffer is empty
    if (readIdx === writeIdx) {
      return false; // Buffer is empty, cannot read
    }

    for (let i = 0; i < STRIDE; i++) {
      frame[i] = dataBuffer[readIdx + i];
    }

    Atomics.store(controlBuffer, READ_PTR_INDEX, (readIdx + STRIDE) % (FRAME_CAPACITY * STRIDE));
    return true;
  },

  // Get number of frames currently in the buffer
  availableData: () => {
    const writeIdx = Atomics.load(controlBuffer, WRITE_PTR_INDEX);
    const readIdx = Atomics.load(controlBuffer, READ_PTR_INDEX);
    let data = (writeIdx - readIdx + (FRAME_CAPACITY * STRIDE)) % (FRAME_CAPACITY * STRIDE);
    return data / STRIDE; // Return frames
  },

  // Get number of empty frames in the buffer
  availableSpace: () => {
    return FRAME_CAPACITY - ringBuffer.availableData() - 1; // -1 because one slot is always left empty to distinguish full/empty
  },

  // Total buffer size in frames
  size: FRAME_CAPACITY
};

module.exports = { ringBuffer }; // New export statement