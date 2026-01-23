// Test if audio callback is actually being called
const portAudio = require('naudiodon2');

console.log('Testing if audio callback is triggered\n');

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
let callbackCount = 0;
let totalSamples = 0;

try {
  const audioStream = new portAudio.AudioIO({
    outOptions: {
      channelCount: CHANNELS,
      sampleFormat: portAudio.SampleFormat32Bit,
      sampleRate: SAMPLE_RATE,
      deviceId: -1,
      closeOnError: true
    }
  });

  let t = 0;
  const dt = 1 / SAMPLE_RATE;
  const freq = 440;
  const amplitude = 0.8;

  audioStream.on('audio', (buffer) => {
    callbackCount++;
    const frames = buffer.length / CHANNELS;
    totalSamples += frames;

    for (let i = 0; i < frames; i++) {
      const sample = Math.sin(2 * Math.PI * freq * t) * amplitude;
      buffer[i * 2] = sample;
      buffer[i * 2 + 1] = sample;
      t += dt;
    }

    // Log every 100 callbacks
    if (callbackCount % 100 === 0) {
      console.log(`Callback #${callbackCount} - Processed ${totalSamples} frames (${(totalSamples/SAMPLE_RATE).toFixed(2)}s)`);
    }
  });

  audioStream.on('error', (err) => {
    console.error('Audio error:', err);
    process.exit(1);
  });

  audioStream.start();
  console.log('*** AUDIO STREAM STARTED ***');
  console.log('Watching for audio callbacks...\n');

  setTimeout(() => {
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total callbacks: ${callbackCount}`);
    console.log(`Total samples: ${totalSamples}`);
    console.log(`Duration: ${(totalSamples/SAMPLE_RATE).toFixed(2)}s`);

    if (callbackCount === 0) {
      console.log('\n⚠️  NO CALLBACKS RECEIVED - Audio stream not working!');
    } else {
      console.log('\n✓ Callbacks working - audio data is being generated');
    }

    audioStream.quit();
    process.exit(0);
  }, 3000);

} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
