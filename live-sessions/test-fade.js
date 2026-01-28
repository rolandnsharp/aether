const signal = require('../src/index');

// Test 1: Instant stop (no fade)
const tone1 = signal('tone1').sin(440).gain(0.2);

setTimeout(() => {
  console.log('Stopping tone1 instantly...');
  tone1.stop();
}, 2000);

// Test 2: Fade out over 3 seconds
const tone2 = signal('tone2').sin(550).gain(0.2);

setTimeout(() => {
  console.log('Fading out tone2 over 3 seconds...');
  tone2.stop(3);
}, 4000);

// Test 3: Multiple tones with different fade times
setTimeout(() => {
  console.log('Starting tone3 (330 Hz)...');
  const tone3 = signal('tone3').sin(330).gain(0.2);

  setTimeout(() => {
    console.log('Fading out tone3 over 2 seconds...');
    tone3.stop(2);
  }, 3000);
}, 8000);

// Test 4: Restart a faded signal
setTimeout(() => {
  console.log('Restarting tone1...');
  tone1.play();

  setTimeout(() => {
    console.log('Fading out tone1 over 1 second...');
    tone1.stop(1);
  }, 2000);
}, 12000);

console.log('Fade test running...');
console.log('- At 2s: tone1 stops instantly');
console.log('- At 4s: tone2 fades out over 3s');
console.log('- At 8s: tone3 starts and fades after 3s');
console.log('- At 12s: tone1 restarts and fades after 2s');
