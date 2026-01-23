// Test device 0 (HDA Intel PCH) directly with loud tone
const portAudio = require('naudiodon2');

console.log('Testing Device 0 (HDA Intel PCH)\n');

const SAMPLE_RATE = 48000;
const CHANNELS = 2;

try {
  const audioStream = new portAudio.AudioIO({
    outOptions: {
      channelCount: CHANNELS,
      sampleFormat: portAudio.SampleFormat32Bit,
      sampleRate: SAMPLE_RATE,
      deviceId: 4,  // PipeWire device
      closeOnError: true,
      framesPerBuffer: 512
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
  console.log('*** PLAYING 440Hz TONE AT 0.8 AMPLITUDE ***');
  console.log('Device: pipewire (ID: 4)');
  console.log('Duration: 3 seconds\n');

  setTimeout(() => {
    console.log('Stopping...');
    audioStream.quit();
    console.log('Done!');
    process.exit(0);
  }, 3000);

} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
