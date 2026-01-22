const signal = require('./src/index');

// Test reverb on mono signal
console.log('Testing mono reverb...');
signal('mono').sin(440).reverb(0.5, 0.4, 0.3).gain(0.3);

setTimeout(() => {
  signal.clear();

  // Test reverb on stereo signal
  console.log('Testing stereo reverb...');
  signal('stereo').sin(440).stereo(signal.sin(445)).reverb(0.5, 0.4, 0.3).gain(0.3);

  setTimeout(() => {
    console.log('Done');
    process.exit(0);
  }, 2000);
}, 2000);
