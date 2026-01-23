// Test jack-backend.js
import { createJackClient } from './jack-backend.js';

console.log("Testing jack-backend.js...\n");

// Simple 440Hz sine wave test
let phase = 0;

const client = createJackClient('wave-test', (bufferL, bufferR, nframes) => {
  const freq = 440;
  const dt = (2 * Math.PI * freq) / client.sampleRate;

  for (let i = 0; i < nframes; i++) {
    const sample = Math.sin(phase) * 0.3;
    bufferL[i] = sample;
    bufferR[i] = sample;
    phase += dt;
  }
});

console.log(`✓ JACK client created`);
console.log(`✓ Sample rate: ${client.sampleRate} Hz`);

client.start();
console.log(`✓ JACK client activated`);
console.log(`\n🎵 Playing 440Hz sine wave for 3 seconds...\n`);

// Run for 3 seconds
await new Promise(resolve => setTimeout(resolve, 3000));

client.close();
console.log("\n✅ jack-backend.js works!");
