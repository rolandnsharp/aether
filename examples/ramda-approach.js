const Speaker = require('speaker');
const R = require('ramda');

// ============================================================================
// RAMDA-BASED FUNCTIONAL AUDIO
// ============================================================================

const SAMPLE_RATE = 48000;

// Oscillators (return functions of time)
const sin = freq => t => Math.sin(2 * Math.PI * freq * t);
const square = freq => t => {
  const phase = (freq * t) % 1;
  return phase < 0.5 ? 1 : -1;
};
const saw = freq => t => {
  const phase = (freq * t) % 1;
  return 2 * phase - 1;
};

// Effects (take a signal function, return a new signal function)
const gain = R.curry((amt, fn) => t => fn(t) * amt);
const offset = R.curry((amt, fn) => t => fn(t) + amt);
const clip = R.curry((threshold, fn) => t => {
  const sample = fn(t);
  return Math.max(-threshold, Math.min(threshold, sample));
});

const delay = R.curry((delayTime, fn) => t => {
  if (t < delayTime) return 0;
  return fn(t - delayTime);
});

const feedback = R.curry((delayTime, feedbackAmt, fn) => {
  const cache = new Map();

  const output = t => {
    const key = Math.round(t * SAMPLE_RATE);
    if (cache.has(key)) return cache.get(key);

    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }

    const dry = fn(t);
    const wet = output(t - delayTime) * feedbackAmt;
    const result = dry + wet;
    cache.set(key, result);
    return result;
  };

  return output;
});

// Mixing using Ramda's converge and sum
const mix = (...fns) => R.converge(R.sum, fns);

// ============================================================================
// EXAMPLES
// ============================================================================

// Example 1: Simple sine wave with gain (using Ramda's pipe)
const example1 = R.pipe(
  gain(0.3)
)(sin(440));

// Example 2: Saw wave with effects chain
const example2 = R.pipe(
  gain(0.5),
  clip(0.3),
  gain(0.4)
)(saw(220));

// Example 3: Delay and feedback
const example3 = R.pipe(
  gain(0.4),
  feedback(0.3, 0.6)
)(sin(330));

// Example 4: Mixed signals using Ramda's converge
const example4 = mix(
  R.pipe(gain(0.2))(sin(440)),
  R.pipe(gain(0.2))(sin(554.37)),
  R.pipe(gain(0.2))(sin(659.25))
);

// Example 5: Using partial application for reusable effects
const echo = feedback(0.3, 0.5);
const quietGain = gain(0.3);

const example5 = R.pipe(
  quietGain,
  echo
)(sin(440));

// Example 6: Point-free style with Ramda
const makeChord = (root, third, fifth) =>
  mix(
    R.pipe(gain(0.25))(sin(root)),
    R.pipe(gain(0.25))(sin(third)),
    R.pipe(gain(0.25))(sin(fifth))
  );

const cMajor = makeChord(261.63, 329.63, 392.00);

// ============================================================================
// AUDIO OUTPUT
// ============================================================================

function playSignal(signalFn, duration = 5) {
  const speaker = new Speaker({
    channels: 2,
    bitDepth: 16,
    sampleRate: SAMPLE_RATE
  });

  const BUFFER_SIZE = 4096;
  const buffer = Buffer.alloc(BUFFER_SIZE * 2 * 2); // stereo, 16-bit

  let currentTime = 0;
  const endTime = duration;

  function writeNextBuffer() {
    if (currentTime >= endTime) {
      speaker.end();
      return;
    }

    // Fill buffer
    for (let i = 0; i < BUFFER_SIZE; i++) {
      const t = currentTime + (i / SAMPLE_RATE);
      const sample = signalFn(t);

      // Clamp and convert to 16-bit
      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = Math.floor(clamped * 32767);

      // Write stereo (same for both channels)
      const offset = i * 4;
      buffer.writeInt16LE(int16, offset);     // left
      buffer.writeInt16LE(int16, offset + 2); // right
    }

    currentTime += BUFFER_SIZE / SAMPLE_RATE;
    speaker.write(buffer, writeNextBuffer);
  }

  writeNextBuffer();
}

// Run an example
console.log('Playing C major chord...');
playSignal(cMajor, 5);
