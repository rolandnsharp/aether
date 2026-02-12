// lel/storage.js - The High-Performance Ring Buffer
// Inspired by the robust atomic design of `aether` and the efficient
// chunk writing of `lol`.

// --- Configuration ---
// STRIDE: The number of channels. 2 for Stereo.
export const STRIDE = 2;
// FRAME_COUNT: The total number of audio frames (~0.68s at 48kHz).
const FRAME_COUNT = 32768;

// --- Shared Memory ---
// We use `globalThis` to ensure the buffer and its cursors survive hot-reloads.
// A SharedArrayBuffer is used for the main data, and another for the cursors.
globalThis.LEL_RING_BUFFER ??= {
  sab: new SharedArrayBuffer(FRAME_COUNT * STRIDE * 4), // Float32 = 4 bytes
  ptrSab: new SharedArrayBuffer(8), // 2x Int32 pointers for read/write cursors
};

const well = globalThis.LEL_RING_BUFFER;

// --- The RingBuffer API ---
export const ringBuffer = {
  data: new Float32Array(well.sab),
  writeIdx: new Int32Array(well.ptrSab, 0, 1),
  readIdx: new Int32Array(well.ptrSab, 4, 1),
  size: FRAME_COUNT * STRIDE, // Total size in elements, not frames
  stride: STRIDE,
  frameCount: FRAME_COUNT,

  /**
   * Writes a large chunk of data efficiently to the ring buffer.
   * This is the "pull" from `lol`'s design.
   * @param {Float32Array} chunk - The chunk of audio data to write.
   * @returns {boolean} - true if write succeeded, false if buffer lacks space.
   */
  writeChunk(chunk) {
    const chunkLen = chunk.length;
    if (this.availableSpace() < chunkLen) {
      console.warn('[RingBuffer] Overrun: Not enough space to write chunk.');
      return false;
    }

    const w = Atomics.load(this.writeIdx, 0);

    // Handle wrap-around copy
    if (w + chunkLen > this.size) {
      const firstChunkSize = this.size - w;
      const secondChunkSize = chunkLen - firstChunkSize;

      const firstSubarray = chunk.subarray(0, firstChunkSize);
      this.data.set(firstSubarray, w);

      const secondSubarray = chunk.subarray(firstChunkSize, chunkLen);
      this.data.set(secondSubarray, 0);
    } else {
      this.data.set(chunk, w);
    }

    Atomics.store(this.writeIdx, 0, (w + chunkLen) % this.size);
    return true;
  },

  /**
   * Get available space in the buffer, in elements.
   * This is the robust model from `aether`.
   * @returns {number} - Number of Float32 elements that can be written.
   */
  availableSpace() {
    const w = Atomics.load(this.writeIdx, 0);
    const r = Atomics.load(this.readIdx, 0);
    return (r - w - 1 + this.size) % this.size;
  },

  /**
   * Get available data in the buffer, in elements.
   * This is the robust model from `aether`.
   * @returns {number} - Number of Float32 elements that can be read.
   */
  availableData() {
    const w = Atomics.load(this.writeIdx, 0);
    const r = Atomics.load(this.readIdx, 0);
    return (w - r + this.size) % this.size;
  },

  /**
   * Clear the buffer by resetting pointers.
   */
  clear() {
    Atomics.store(this.writeIdx, 0, 0);
    Atomics.store(this.readIdx, 0, 0);
    console.log('[RingBuffer] Cleared.');
  }
};
