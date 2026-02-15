// tone_rhythmos.js - Plays a pure 432 Hz sine wave using the Rhythmos (stateful) paradigm.

// This demonstrates explicit state management for phase continuity.

play('tone-432-rhythmos', s => {
  const frequency = 432; // A4 = 432 Hz
  const amplitude = 0.5;

  // s.state[0] stores the phase accumulator for this signal.
  // It will persist across hot-reloads, ensuring phase continuity.
  s.state[0] = (s.state[0] || 0) + (frequency / s.sr);
  s.state[0] %= 1.0; // Wrap phase around 0 to 1

  return Math.sin(s.state[0] * 2 * Math.PI) * amplitude;
});

console.log('Playing a 432 Hz tone using the Rhythmos paradigm. Press Ctrl+C to stop.');
