// Test pipewire device (ID 4) directly
const portAudio = require('naudiodon2');

console.log('Testing pipewire device (ID 4) directly\n');

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
let callbackCount = 0;

try {
  const audioStream = new portAudio.AudioIO({
    outOptions: {
      channelCount: CHANNELS,
      sampleFormat: portAudio.SampleFormat32Bit,
      sampleRate: SAMPLE_RATE,
      deviceId: 4,  // pipewire device
      closeOnError: true,
      framesPerBuffer: 512
    }
  });

  let t = 0;
  const dt = 1 / SAMPLE_RATE;
  const freq = 440;
  const amplitude = 0.8;

  audioStream.on('audio', (buffer) => {
    callbackCount++;
    const frames = buffer.length / CHANNELS;

    for (let i = 0; i < frames; i++) {
      const sample = Math.sin(2 * Math.PI * freq * t) * amplitude;
      buffer[i * 2] = sample;
      buffer[i * 2 + 1] = sample;
      t += dt;
    }

    if (callbackCount === 1 || callbackCount % 50 === 0) {
      console.log(`Callback #${callbackCount}`);
    }
  });

  audioStream.on('error', (err) => {
    console.error('Audio error:', err);
    process.exit(1);
  });

  audioStream.start();
  console.log('*** AUDIO STARTED - 440Hz at 0.8 amplitude ***\n');

  setTimeout(() => {
    console.log(`\nTotal callbacks: ${callbackCount}`);
    console.log('Stopping...');
    audioStream.quit();
    console.log('Done!');
    process.exit(0);
  }, 3000);

} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
