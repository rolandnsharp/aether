const signal = require('./src/index');

// Test 1: Mono signal (should work)
console.log('Testing mono signal...');
signal('mono').sin(440);

setTimeout(() => {
  console.log('Clearing mono...');
  signal.clear();

  // Test 2: Stereo signal
  console.log('Testing stereo signal...');
  signal('stereo').sin(440).stereo(signal.sin(445)).gain(2);

  setTimeout(() => {
    console.log('Done');
    process.exit(0);
  }, 2000);
}, 2000);
