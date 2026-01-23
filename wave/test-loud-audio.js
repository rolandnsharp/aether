// Loud audio test with different settings
const portAudio = require('naudiodon2');

console.log('LOUD Audio Test\n');

// Try using the analog device directly
const devices = portAudio.getDevices();

console.log('Available output devices:');
devices.filter(d => d.maxOutputChannels > 0).forEach(d => {
  console.log(`  ${d.id}: ${d.name} (${d.maxOutputChannels} channels)`);
});
console.log('');

// Try device 5 (default) specifically
const deviceId = 5;
const SAMPLE_RATE = 48000;
const CHANNELS = 2;

console.log(`Using device ID: ${deviceId}`);
console.log(`Sample rate: ${SAMPLE_RATE} Hz`);
console.log(`Channels: ${CHANNELS}`);
console.log('Playing LOUD 440Hz tone for 3 seconds...\n');

try {
  const audioStream = new portAudio.AudioIO({
    outOptions: {
      channelCount: CHANNELS,
      sampleFormat: portAudio.SampleFormat32Bit,
      sampleRate: SAMPLE_RATE,
      deviceId: deviceId,
      closeOnError: true,
      framesPerBuffer: 512  // Larger buffer
    }
  });

  let t = 0;
  const dt = 1 / SAMPLE_RATE;
  const freq = 440;
  const amplitude = 0.8; // LOUD

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
  console.log('*** AUDIO SHOULD BE PLAYING NOW ***\n');

  setTimeout(() => {
    console.log('\nStopping...');
    audioStream.quit();
    console.log('Done!');
    process.exit(0);
  }, 3000);

} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
