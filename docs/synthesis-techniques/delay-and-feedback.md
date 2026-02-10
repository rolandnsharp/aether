# Delay and Feedback

> *"Time is the substance of which I am made."* — Borges

## Introduction

Delay effects create echoes by playing back a signal after a time interval. Feedback sends the delayed signal back into itself, creating repeated echoes or self-oscillating systems.

---

## Simple Delay (No Feedback)

### Basic Echo

In Kanon (pure `f(t)`), simple delays are trivial—just evaluate at an earlier time:

```javascript
import { Kanon } from './src/arche/kanon/index.js';

const dry = t => Math.sin(2 * Math.PI * 440 * t);

const echo = t => {
  const direct = dry(t);
  const delayed = t >= 0.5 ? dry(t - 0.5) : 0;  // 500ms delay
  return (direct + delayed * 0.5) * 0.3;
};

Kanon.register('simple-echo', echo);
```

**No state needed!** Just look backwards in time.

### Multi-Tap Delay

Multiple delays at different times:

```javascript
const multiTap = t => {
  const signal = Math.sin(2 * Math.PI * 440 * t);

  const taps = [
    { time: 0.0, gain: 1.0 },    // Direct
    { time: 0.25, gain: 0.6 },   // 250ms
    { time: 0.5, gain: 0.4 },    // 500ms
    { time: 0.75, gain: 0.2 }    // 750ms
  ];

  let sum = 0;
  for (const tap of taps) {
    if (t >= tap.time) {
      sum += signal * tap.gain * (t >= tap.time ? 1 : 0);
    }
  }

  return sum * 0.2;
};

Kanon.register('multi-tap', multiTap);
```

---

## Feedback Delay

Feedback creates repeating echoes. In pure functional style, use **recursion with memoization**:

### Pure Functional Feedback

```javascript
// Using Kanon's feedback helper (src/arche/kanon/helpers.js)
const dry = t => Math.sin(2 * Math.PI * 440 * t);

Kanon.register('feedback-echo',
  Kanon.pipe(
    dry,
    Kanon.feedback(0.375, 0.7)  // 375ms delay, 70% feedback
  )
);
```

### How It Works (Under the Hood)

```javascript
// From src/arche/kanon/helpers.js
export const feedback = curry((delayTime, feedbackAmt, fn, sampleRate = 48000) => {
  const cache = new Map();

  const output = t => {
    const key = Math.round(t * sampleRate);
    if (cache.has(key)) return cache.get(key);

    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }

    const dry = fn(t);
    const wet = output(t - delayTime) * feedbackAmt;  // Recursive!
    const result = dry + wet;
    cache.set(key, result);
    return result;
  };

  return output;
});
```

**Key insight**: `output(t - delayTime)` looks *backwards in time*, so it's not infinitely recursive. Memoization makes it O(1) when evaluated sequentially.

---

## Dub Echo

Classic reggae/dub delay effect:

```javascript
const dry = t => Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 2);

Kanon.register('dub-echo',
  Kanon.pipe(
    dry,
    Kanon.feedback(0.375, 0.7),  // 3/16 note at 120 BPM
    Kanon.softClip,               // Analog warmth
    Kanon.gain(0.5)
  )
);
```

---

## Ping-Pong Delay (Stereo)

Alternates between left and right channels:

```javascript
// This requires stereo support - conceptual example
const pingPong = t => {
  const signal = Math.sin(2 * Math.PI * 440 * t);
  const delayTime = 0.3;

  // Left: odd echoes
  const left = signal + (t >= delayTime ? pingPong(t - delayTime * 2)[1] : 0) * 0.6;

  // Right: even echoes
  const right = (t >= delayTime ? pingPong(t - delayTime)[0] : 0) * 0.6;

  return [left, right];
};

// Note: Requires careful memoization for efficiency
```

---

## Comb Filter

Very short delay creates spectral notches:

```javascript
const combFilter = t => {
  const input = Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t * 1);
  const delayTime = 1 / 880;  // Creates notches at 880Hz, 1760Hz, etc.

  const delayed = t >= delayTime ? input : 0;
  return (input + delayed) * 0.5;
};

Kanon.register('comb', combFilter);
```

**Result**: Metallic, resonant timbre from constructive/destructive interference.

---

## Karplus-Strong (Plucked String)

Physical modeling using feedback delay:

```javascript
// Noise burst + feedback = plucked string sound
const karplusStrong = t => {
  const freq = 220;
  const delayTime = 1 / freq;

  // Initial impulse (noise burst)
  const impulse = (t < 0.01) ? (Math.random() * 2 - 1) : 0;

  // Feedback with lowpass (averaging)
  const feedbackCache = new Map();

  const loop = t => {
    const key = Math.round(t * 48000);
    if (feedbackCache.has(key)) return feedbackCache.get(key);

    if (t < delayTime) {
      feedbackCache.set(key, impulse);
      return impulse;
    }

    // Lowpass filter = average two adjacent samples
    const prev1 = loop(t - delayTime);
    const prev2 = loop(t - delayTime - 1/48000);
    const result = (prev1 + prev2) / 2 * 0.995;  // Slight damping

    feedbackCache.set(key, result);
    return result;
  };

  return loop(t) * 0.5;
};

Kanon.register('plucked-string', karplusStrong);
```

---

## Delay Time Modulation

Create chorus/flanger effects by modulating delay time:

```javascript
const modulatedDelay = t => {
  const dry = Math.sin(2 * Math.PI * 440 * t);

  // LFO modulates delay time
  const lfo = Math.sin(2 * Math.PI * 0.5 * t);  // 0.5 Hz
  const delayTime = 0.02 + lfo * 0.01;  // 10-30ms

  const wet = t >= delayTime ? dry * (t >= delayTime ? 1 : 0) : 0;

  return (dry + wet) * 0.4;
};

Kanon.register('chorus', modulatedDelay);
```

---

## Rhythmic Delays

### Dotted Eighth (3/16 Note)

```javascript
// At 120 BPM, quarter note = 0.5 sec
// Dotted eighth = 3/8 of quarter = 0.1875 sec
const dottedEighth = t => {
  const signal = Math.sin(2 * Math.PI * 330 * t) * Math.exp(-t * 2);

  return Kanon.feedback(0.1875, 0.65)(signal);
};
```

### Triplet Delay

```javascript
// Triplet eighth = 1/3 of quarter
const triplet = t => {
  const signal = Math.sin(2 * Math.PI * 330 * t) * Math.exp(-t * 2);

  return Kanon.feedback(0.5 / 3, 0.7)(signal);  // ~166ms
};
```

---

## Delay Networks

Multiple delays with cross-feedback create dense reverb-like effects:

```javascript
// Schroeder allpass network (reverb building block)
const allpass = (delayTime, feedback) => fn => {
  const cache = new Map();

  const process = t => {
    const key = Math.round(t * 48000);
    if (cache.has(key)) return cache.get(key);

    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }

    const input = fn(t);
    const delayed = process(t - delayTime);

    // Allpass formula: y[n] = -x[n] + x[n-D] + g·y[n-D]
    const result = -input + fn(t - delayTime) + feedback * delayed;

    cache.set(key, result);
    return result;
  };

  return process;
};

// Chain multiple allpass filters
const dry = t => Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 1);

Kanon.register('reverb-network',
  Kanon.pipe(
    dry,
    allpass(0.0297, 0.7),  // Prime numbers for density
    allpass(0.0371, 0.7),
    allpass(0.0411, 0.7),
    allpass(0.0437, 0.7),
    Kanon.gain(0.3)
  )
);
```

---

## Y-Combinator Feedback

Use the Y-combinator for anonymous recursive feedback:

```javascript
// From src/arche/kanon/helpers.js
export const feedbackY = curry((delayTime, feedbackAmt, fn, sampleRate = 48000) => {
  const cache = new Map();

  // Feedback as a fixed point - no named self-reference!
  return Kanon.Y(recurse => t => {
    const key = Math.round(t * sampleRate);
    if (cache.has(key)) return cache.get(key);

    if (t < delayTime) {
      const result = fn(t);
      cache.set(key, result);
      return result;
    }

    const dry = fn(t);
    const wet = recurse(t - delayTime) * feedbackAmt;
    const result = dry + wet;
    cache.set(key, result);
    return result;
  });
});
```

**Philosophical beauty**: The feedback loop emerges from pure mathematical recursion!

---

## Rhythmos Approach (Stateful)

For comparison, here's how feedback delay works in Rhythmos (Earth paradigm):

```javascript
import { Rhythmos } from './src/arche/rhythmos/index.js';

Rhythmos.register('stateful-delay', (state, idx, sampleRate) => {
  const delayTime = 0.375;  // seconds
  const feedback = 0.7;
  const delaySamples = Math.floor(delayTime * sampleRate);

  // Allocate delay buffer in state
  const bufferStart = idx;
  const bufferSize = delaySamples;

  return {
    update: (context) => {
      // Input signal
      const input = Math.sin(2 * Math.PI * 440 * context.t);

      // Read from delay buffer
      const readPos = (state[idx + bufferSize] || 0);
      const delayed = state[bufferStart + Math.floor(readPos)] || 0;

      // Mix
      const output = input + delayed * feedback;

      // Write to delay buffer
      const writePos = (readPos + 1) % bufferSize;
      state[bufferStart + Math.floor(writePos)] = output;
      state[idx + bufferSize] = writePos;

      return [output * 0.5];
    }
  };
});
```

**Trade-off**: Rhythmos is more efficient but requires explicit state management.

---

## When to Use Each Approach

### Use Kanon (Pure f(t)) when:
- Delays are simple (no feedback or short feedback)
- Mathematical elegance matters
- Learning/teaching

### Use Rhythmos (Stateful) when:
- Long delay times (> 1 second)
- Performance-critical
- Production use

---

## Further Reading

- [State vs Recursion](../advanced/state-vs-recursion.md) - Pure functional vs stateful approaches
- [Y-Combinator Music](../paradigms/kanon/generative/y-combinator.md) - Anonymous recursion
- [Karplus-Strong](https://en.wikipedia.org/wiki/Karplus%E2%80%93Strong_string_synthesis) - Physical modeling with delay

---

**Next**: [Modulation Techniques](modulation.md) | [Additive Synthesis](additive-synthesis.md)
