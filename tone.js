// tone.js - Plays a pure 432 Hz sine wave.

// This is an example of the Kanon (Fire 🔥) paradigm.
// It's a pure, stateless function of time.

play('tone-432', s => {
  const frequency = 432; // A4 = 432 Hz
  const amplitude = 0.5;

  return Math.sin(2 * Math.PI * frequency * s.t) * amplitude;
});

console.log('Playing a 432 Hz tone. Press Ctrl+C to stop.');
