import Speaker from 'speaker';

const SAMPLE_RATE = 48000;
const CHANNELS = 2; // Stereo
const BIT_DEPTH = 32;
const BUFFER_SIZE = 1024;

let speaker;

export function initAudio() {
  speaker = new Speaker({
    channels: CHANNELS,
    bitDepth: BIT_DEPTH,
    sampleRate: SAMPLE_RATE,
    float: true,
  });
  console.log('Audio transport initialized.');
}

export function write(buffer) {
  if (speaker) {
    speaker.write(Buffer.from(buffer.buffer));
  }
}

export const config = {
  SAMPLE_RATE,
  CHANNELS,
  BIT_DEPTH,
  BUFFER_SIZE,
  STRIDE: CHANNELS,
};
