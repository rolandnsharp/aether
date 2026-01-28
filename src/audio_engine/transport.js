// src/audio_engine/transport.js
// ============================================================================
// Transport - Connects Ring Buffer to Speaker.js using Node.js Streams
//
// This version is a direct port of the robust architecture from `flux`.
// It uses a single reusable buffer and a proper Readable stream implementation
// to ensure a stable, high-performance audio pipeline with no GC pressure.
// ============================================================================

const Speaker = require('speaker');
const { Readable } = require('stream');
const { ringBuffer } = require('./storage.js');

// Constants from the reference architecture
const CHANNELS = ringBuffer.stride;
const BYTES_PER_SAMPLE = 4; // 32-bit float
const MAX_BUFFER_SIZE_FRAMES = 65536;
const MAX_BUFFER_SIZE_BYTES = MAX_BUFFER_SIZE_FRAMES * CHANNELS * BYTES_PER_SAMPLE;

// The single, reusable buffer to prevent GC churn.
const reusableBuffer = Buffer.alloc(MAX_BUFFER_SIZE_BYTES);

function createTransport(mode, sampleRate) {
  if (mode !== 'PUSH') {
    throw new Error('Only PUSH mode (stream-based) is supported.');
  }

  let speakerInstance = null;
  let streamInstance = null;

  const transportObject = {
    start: () => {
      if (speakerInstance) return;
      
      speakerInstance = new Speaker({
        channels: CHANNELS,
        bitDepth: 32,
        sampleRate: sampleRate,
        float: true,
      });

      streamInstance = new Readable({
        read(size) {
          const requestedFrames = Math.floor(size / (BYTES_PER_SAMPLE * CHANNELS));
          const availableFrames = ringBuffer.availableData();
          const framesToRead = Math.min(requestedFrames, availableFrames);

          // Read available data from ring buffer into our reusable buffer
          const tempFrame = new Float64Array(CHANNELS);
          for (let i = 0; i < framesToRead; i++) {
            ringBuffer.read(tempFrame);
            for (let c = 0; c < CHANNELS; c++) {
              reusableBuffer.writeFloatLE(tempFrame[c] || 0, (i * CHANNELS + c) * BYTES_PER_SAMPLE);
            }
          }

          // Handle underrun: if we couldn't provide all requested frames, fill the rest with silence.
          if (framesToRead < requestedFrames) {
            const startOffset = framesToRead * CHANNELS * BYTES_PER_SAMPLE;
            const endOffset = requestedFrames * CHANNELS * BYTES_PER_SAMPLE;
            reusableBuffer.fill(0, startOffset, endOffset);
          }
          
          // Push a zero-copy view of the exact size the consumer requested.
          this.push(reusableBuffer.subarray(0, requestedFrames * CHANNELS * BYTES_PER_SAMPLE));
        }
      });
      
      streamInstance.pipe(speakerInstance);
      console.log(`[Transport] Starting Speaker.js via Readable stream (${sampleRate}Hz, 32-bit float, ${CHANNELS} channels)`);
    },

    stop: () => {
      if (streamInstance && speakerInstance) {
        streamInstance.unpipe(speakerInstance);
        speakerInstance.end();
      }
      streamInstance = null;
      speakerInstance = null;
      console.log('[Transport] Speaker transport stopped.');
    },

    status: () => ({
      running: !!speakerInstance,
    })
  };

  return transportObject;
}

module.exports = { createTransport };
