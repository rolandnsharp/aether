// Test with deviceId: -1 (let PortAudio choose system default)
const portAudio = require('naudiodon2');

console.log('Testing with deviceId: -1 (system default)\n');

const SAMPLE_RATE = 48000;
const CHANNELS = 2;

try {
  const audioStream = new portAudio.AudioIO({
    outOptions: {
      channelCount: CHANNELS,
      sampleFormat: portAudio.SampleFormat32Bit,
      sampleRate: SAMPLE_RATE,
      deviceId: -1,  // System default
      closeOnError: true
    }
  });

  let t = 0;
  const dt = 1 / SAMPLE_RATE;
  const freq = 440;
  const amplitude = 0.8;

  audioStream.on('audio', (buffer) => {
    const frames = buffer.length / CHANNELS;

    for (let i = 0; i < frames; i++) {
      const sample = Math.sin(2 * Math.PI * freq * t) * amplitude;
      buffer[i * 2] = sample;
      buffer[i * 2 + 1] = sample;
      t += dt;
    }
  });

  audioStream.on('error', (err) => {
    console.error('Audio error:', err);
    process.exit(1);
  });

  audioStream.start();
  console.log('*** AUDIO SHOULD BE PLAYING ***');
  console.log('Check for PipeWire stream in another terminal:\n');
  console.log('  wpctl status | grep -A 15 "Streams:"\n');

  setTimeout(() => {
    console.log('Stopping...');
    audioStream.quit();
    process.exit(0);
  }, 5000);

} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
