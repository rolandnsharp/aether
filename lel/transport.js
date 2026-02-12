// lel/transport.js - The "Consumer"
// This module's job is to read audio from the shared ring buffer
// and send it to the audio hardware.

import Speaker from 'speaker';
import { Readable } from 'stream';
import { ringBuffer } from './storage.js';

export const config = {
  SAMPLE_RATE: 48000,
  CHANNELS: 2, // Stereo
  BIT_DEPTH: 32,
  // The number of SAMPLES (not frames or elements) to pull from the ring buffer at a time.
  // This is the chunk size the speaker will request.
  CHUNK_SIZE: 1024,
};

// A custom Readable stream that acts as the "Consumer"
class AudioStream extends Readable {
  constructor(options) {
    super(options);
  }

  _read(size) {
    // `size` is the number of bytes the downstream consumer wants. We convert
    // this to the number of elements our Float32Array uses.
    const requestedElements = size / 4; // 4 bytes per Float32
    const elementsToPush = Math.min(requestedElements, config.CHUNK_SIZE * ringBuffer.stride);
    
    // This is a simple busy-wait for data. A more advanced implementation
    // might use Atomics.wait in a worker thread for better CPU efficiency,
    // but for a live-coding tool, this direct approach is often sufficient.
    while (ringBuffer.availableData() < elementsToPush) {
      // If we are starved for data, it's better to push silence than to close
      // the stream. This indicates the producer loop isn't running fast enough.
      const silence = Buffer.alloc(size);
      this.push(silence);
      console.warn('[Consumer] Starvation: Pushing silence.');
      return;
    }

    // Read the available chunk from the ring buffer
    const r = Atomics.load(ringBuffer.readIdx, 0);
    const chunkLen = elementsToPush;
    const output = new Float32Array(chunkLen);

    // Handle wrap-around reading
    if (r + chunkLen > ringBuffer.size) {
        const firstChunkSize = ringBuffer.size - r;
        const secondChunkSize = chunkLen - firstChunkSize;

        output.set(ringBuffer.data.subarray(r, r + firstChunkSize), 0);
        output.set(ringBuffer.data.subarray(0, secondChunkSize), firstChunkSize);
    } else {
        output.set(ringBuffer.data.subarray(r, r + chunkLen), 0);
    }
    
    Atomics.store(ringBuffer.readIdx, 0, (r + chunkLen) % ringBuffer.size);

    this.push(Buffer.from(output.buffer));
  }
}

export function startStream() {
  const speaker = new Speaker({
    channels: config.CHANNELS,
    bitDepth: config.BIT_DEPTH,
    sampleRate: config.SAMPLE_RATE,
    float: true,
  });
  console.log('Audio transport (consumer) initialized and stream started.');

  const audioStream = new AudioStream();
  audioStream.pipe(speaker);
}
