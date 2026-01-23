// Test "default" ALSA device which should route through PipeWire
const portAudio = require('naudiodon2');

console.log('Testing "default" ALSA device (ID: 5)\n');

const SAMPLE_RATE = 48000;
const CHANNELS = 2;

try {
  const audioStream = new portAudio.AudioIO({
    outOptions: {
      channelCount: CHANNELS,
      sampleFormat: portAudio.SampleFormat32Bit,
      sampleRate: SAMPLE_RATE,
      deviceId: 5,  // "default" device
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
  console.log('*** AUDIO PLAYING - CHECK FOR PIPEWIRE STREAM ***');
  console.log('Run: wpctl status | grep -A 15 "Streams:"\n');

  // Keep running for 10 seconds so user can check streams
  setTimeout(() => {
    console.log('\nStopping...');
    audioStream.quit();
    process.exit(0);
  }, 10000);

} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
