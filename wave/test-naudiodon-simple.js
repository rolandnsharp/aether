// Minimal naudiodon2 test based on examples
const portAudio = require('naudiodon2');

const ao = new portAudio.AudioIO({
  outOptions: {
    channelCount: 2,
    sampleFormat: portAudio.SampleFormatInt16,
    sampleRate: 44100
  }
});

let phase = 0;
ao.on('audio', (buf) => {
  console.log('Got audio callback!');
  for (let i = 0; i < buf.length; i += 2) {
    const sample = Math.floor(Math.sin(phase) * 10000);
    buf.writeInt16LE(sample, i);
    phase += 0.01;
  }
});

ao.start();
console.log('Started');

setTimeout(() => {
  ao.quit();
  console.log('Done');
  process.exit(0);
}, 2000);
