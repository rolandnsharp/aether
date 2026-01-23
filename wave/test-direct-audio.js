// Direct naudiodon2 test
const portAudio = require('naudiodon2');

console.log('Testing direct naudiodon2 audio output...\n');

// Find best output device
const devices = portAudio.getDevices();
let outputDevice = devices.find(d => d.name === 'pipewire' && d.maxOutputChannels > 0);

if (!outputDevice) {
  outputDevice = devices.find(d => d.name === 'default' && d.maxOutputChannels > 0);
}

if (!outputDevice) {
  outputDevice = devices.find(d => d.maxOutputChannels > 0);
}

console.log(`Using device: ${outputDevice.name} (ID: ${outputDevice.id})`);
console.log(`Max output channels: ${outputDevice.maxOutputChannels}`);
console.log(`Default sample rate: ${outputDevice.defaultSampleRate}\n`);

const SAMPLE_RATE = 48000;
const CHANNELS = 2;

try {
  const audioStream = new portAudio.AudioIO({
    outOptions: {
      channelCount: CHANNELS,
      sampleFormat: portAudio.SampleFormat32Bit,
      sampleRate: SAMPLE_RATE,
      deviceId: outputDevice.id,
      closeOnError: true
    }
  });

  console.log('Audio stream created successfully!');
  console.log('Playing 440Hz sine wave for 3 seconds...\n');

  let t = 0;
  const dt = 1 / SAMPLE_RATE;

  audioStream.on('audio', (buffer) => {
    const frames = buffer.length / CHANNELS;

    for (let i = 0; i < frames; i++) {
      // Generate 440Hz sine wave
      const sample = Math.sin(2 * Math.PI * 440 * t) * 0.3;

      buffer[i * 2] = sample;     // Left
      buffer[i * 2 + 1] = sample; // Right

      t += dt;
    }
  });

  audioStream.on('error', (err) => {
    console.error('Audio error:', err);
    process.exit(1);
  });

  audioStream.start();
  console.log('Audio started!');

  // Play for 3 seconds
  setTimeout(() => {
    console.log('\nStopping audio...');
    audioStream.quit();
    console.log('Test complete!');
    process.exit(0);
  }, 3000);

} catch (err) {
  console.error('Error creating audio stream:', err);
  process.exit(1);
}
