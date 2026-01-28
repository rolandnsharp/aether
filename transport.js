// transport.js - Modular Audio Sink (Speaker.js → JACK FFI)
// ============================================================================
// "The Pipe" - Swappable transport layer for audio output
// ============================================================================

import Speaker from 'speaker';
import { Readable } from 'stream';
import { STRIDE } from './storage.js';

/**
 * Create audio transport
 * @param {string} mode - 'PUSH' (speaker.js) or 'PULL' (JACK FFI - future)
 * @param {Object} ringBuffer - Ring buffer to read from
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {Object} - Transport object with cleanup method
 */
export function createTransport(mode, ringBuffer, sampleRate = 44100) {
  if (mode === 'PUSH') {
    // Current implementation: Push to speaker.js via stream
    const speaker = new Speaker({
      channels: STRIDE,
      bitDepth: 16,
      sampleRate,
      signed: true,
    });

    const stream = new Readable({
      read(size) {
        // Convert byte size to sample count
        const bytesPerSample = 2; // 16-bit = 2 bytes
        const samples = Math.floor(size / (bytesPerSample * STRIDE));
        const buf = Buffer.alloc(samples * bytesPerSample * STRIDE);

        for (let i = 0; i < samples; i++) {
          const vector = ringBuffer.read();

          // Write each channel as 16-bit signed integer
          for (let ch = 0; ch < STRIDE; ch++) {
            const sample = vector[ch] || 0;
            // Convert float (-1 to 1) to 16-bit signed int (-32768 to 32767)
            const int16 = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
            buf.writeInt16LE(int16, (i * STRIDE + ch) * bytesPerSample);
          }
        }

        this.push(buf);
      }
    });

    stream.pipe(speaker);

    return {
      type: 'PUSH',
      stop: () => {
        stream.unpipe(speaker);
        speaker.end();
      }
    };
  }

  if (mode === 'PULL') {
    // Future implementation: JACK FFI pull-based callback
    // The C callback will directly read from ringBuffer memory
    console.log('[Transport] PULL mode (JACK FFI) not yet implemented');
    return {
      type: 'PULL',
      stop: () => {
        console.log('[Transport] PULL mode cleanup');
      }
    };
  }

  throw new Error(`Unknown transport mode: ${mode}`);
}
