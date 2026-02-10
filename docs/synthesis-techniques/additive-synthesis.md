# Additive Synthesis

> *"All sound is the sum of sine waves."* — Fourier

## The Fundamental Principle

Additive synthesis builds complex timbres by summing simple sine waves (partials). This is the most direct implementation of Fourier's theorem: any periodic waveform can be constructed from sine waves.

---

## Basic Additive Synthesis

### Harmonic Series

The harmonic series is the foundation of musical timbre:

```javascript
import { Kanon } from './src/arche/kanon/index.js';

// Fundamental + harmonics
const additive = t => {
  const fundamental = 110;  // A2

  let sum = 0;
  for (let n = 1; n <= 8; n++) {
    const freq = fundamental * n;
    const amplitude = 1.0 / n;  // Natural amplitude decay
    sum += Math.sin(2 * Math.PI * freq * t) * amplitude;
  }

  return sum * 0.1;
};

Kanon.register('harmonic-series', additive);
```

**Result**: Rich, complex tone with natural harmonic content.

---

## Classic Waveforms via Additive

### Sawtooth Wave

Contains all harmonics with 1/n amplitude:

```javascript
const sawtooth = t => {
  const fundamental = 110;
  let sum = 0;

  for (let n = 1; n <= 32; n++) {
    sum += Math.sin(2 * Math.PI * fundamental * n * t) / n;
  }

  return sum * 0.2;
};

Kanon.register('additive-saw', sawtooth);
```

### Square Wave

Contains only odd harmonics:

```javascript
const square = t => {
  const fundamental = 110;
  let sum = 0;

  for (let n = 1; n <= 32; n += 2) {  // Odd harmonics only
    sum += Math.sin(2 * Math.PI * fundamental * n * t) / n;
  }

  return sum * 0.2;
};

Kanon.register('additive-square', square);
```

### Triangle Wave

Odd harmonics with 1/n² amplitude:

```javascript
const triangle = t => {
  const fundamental = 110;
  let sum = 0;

  for (let n = 1; n <= 32; n += 2) {
    const sign = (((n - 1) / 2) % 2 === 0) ? 1 : -1;
    sum += sign * Math.sin(2 * Math.PI * fundamental * n * t) / (n * n);
  }

  return sum * 0.3;
};

Kanon.register('additive-triangle', triangle);
```

---

## Timbral Variations

### Bright Timbre (Emphasize High Harmonics)

```javascript
const bright = t => {
  const fundamental = 110;
  let sum = 0;

  for (let n = 1; n <= 16; n++) {
    const amplitude = 1.0 / Math.sqrt(n);  // Less decay = brighter
    sum += Math.sin(2 * Math.PI * fundamental * n * t) * amplitude;
  }

  return sum * 0.08;
};
```

### Dark Timbre (Suppress High Harmonics)

```javascript
const dark = t => {
  const fundamental = 110;
  let sum = 0;

  for (let n = 1; n <= 16; n++) {
    const amplitude = 1.0 / (n * n);  // Faster decay = darker
    sum += Math.sin(2 * Math.PI * fundamental * n * t) * amplitude;
  }

  return sum * 0.2;
};
```

### Even-Odd Balance

```javascript
const balanced = t => {
  const fundamental = 110;
  let sum = 0;

  for (let n = 1; n <= 16; n++) {
    // Odd harmonics louder than even
    const amplitude = (n % 2 === 1) ? 1.0 / n : 0.5 / n;
    sum += Math.sin(2 * Math.PI * fundamental * n * t) * amplitude;
  }

  return sum * 0.12;
};
```

---

## Inharmonic Synthesis

Move beyond the harmonic series for metallic, bell-like timbres:

### Linear Inharmonicity

```javascript
const inharmonic = t => {
  const fundamental = 200;
  const stretch = 1.02;  // Stretch factor
  let sum = 0;

  for (let n = 1; n <= 12; n++) {
    const freq = fundamental * Math.pow(n, stretch);  // Not exact multiples
    const amplitude = 1.0 / (n * 1.5);
    sum += Math.sin(2 * Math.PI * freq * t) * amplitude;
  }

  return sum * 0.15;
};

Kanon.register('bell', inharmonic);
```

### Golden Ratio Partials

```javascript
const golden = t => {
  const fundamental = 110;
  const phi = 1.618033988749;  // Golden ratio
  let sum = 0;

  for (let n = 0; n < 8; n++) {
    const freq = fundamental * Math.pow(phi, n);
    const amplitude = 1.0 / (n + 1);
    sum += Math.sin(2 * Math.PI * freq * t) * amplitude;
  }

  return sum * 0.1;
};

Kanon.register('golden-timbre', golden);
```

---

## Dynamic Additive Synthesis

### Time-Varying Amplitudes

```javascript
const morphing = t => {
  const fundamental = 110;
  let sum = 0;

  for (let n = 1; n <= 16; n++) {
    // Amplitude envelope per harmonic
    const lfo = Math.sin(2 * Math.PI * (0.5 + n * 0.1) * t);
    const amplitude = (1.0 / n) * (0.5 + 0.5 * lfo);

    sum += Math.sin(2 * Math.PI * fundamental * n * t) * amplitude;
  }

  return sum * 0.08;
};

Kanon.register('morphing-timbre', morphing);
```

### Spectral Scanning

```javascript
const scanning = t => {
  const fundamental = 110;
  const scanRate = 0.2;  // Hz
  const scanPosition = (Math.sin(2 * Math.PI * scanRate * t) + 1) / 2;  // 0-1

  let sum = 0;
  for (let n = 1; n <= 32; n++) {
    // Amplitude based on distance from scan position
    const harmonicPosition = n / 32;
    const distance = Math.abs(harmonicPosition - scanPosition);
    const amplitude = Math.exp(-distance * 10) / n;

    sum += Math.sin(2 * Math.PI * fundamental * n * t) * amplitude;
  }

  return sum * 0.15;
};

Kanon.register('spectral-scan', scanning);
```

---

## Organ Registration

Classic organ stops as additive recipes:

### 8' (Fundamental)
```javascript
const organ8 = t => {
  const f = 110;
  return (
    Math.sin(2 * Math.PI * f * t) * 1.0 +      // 1'
    Math.sin(2 * Math.PI * f * 2 * t) * 0.5 +  // 2'
    Math.sin(2 * Math.PI * f * 3 * t) * 0.3    // 3'
  ) * 0.15;
};
```

### 4' (Octave)
```javascript
const organ4 = t => {
  const f = 220;  // One octave higher
  return (
    Math.sin(2 * Math.PI * f * t) * 1.0 +
    Math.sin(2 * Math.PI * f * 2 * t) * 0.4 +
    Math.sin(2 * Math.PI * f * 3 * t) * 0.2
  ) * 0.15;
};
```

### Mixture (Multiple Ranks)
```javascript
const mixture = t => {
  const f = 110;
  return (
    // 8' rank
    Math.sin(2 * Math.PI * f * t) * 0.5 +
    // 4' rank
    Math.sin(2 * Math.PI * f * 2 * t) * 0.4 +
    // 2-2/3' rank (perfect fifth)
    Math.sin(2 * Math.PI * f * 3 * t) * 0.3 +
    // 2' rank
    Math.sin(2 * Math.PI * f * 4 * t) * 0.2
  ) * 0.15;
};

Kanon.register('organ-mixture', mixture);
```

---

## Formant Synthesis

Emphasize specific frequency regions (like vowels):

```javascript
const formantSynth = (fundamental, formants) => t => {
  let sum = 0;

  for (let n = 1; n <= 32; n++) {
    const freq = fundamental * n;

    // Calculate amplitude based on formants
    let amplitude = 1.0 / n;
    for (const formant of formants) {
      const distance = Math.abs(freq - formant.freq);
      const boost = Math.exp(-distance / formant.bandwidth);
      amplitude *= (1.0 + boost * formant.gain);
    }

    sum += Math.sin(2 * Math.PI * freq * t) * amplitude;
  }

  return sum * 0.05;
};

// Vowel "ah" (approximate)
const vowelAh = formantSynth(110, [
  { freq: 700, bandwidth: 100, gain: 2.0 },   // F1
  { freq: 1220, bandwidth: 150, gain: 1.5 },  // F2
  { freq: 2600, bandwidth: 200, gain: 1.0 }   // F3
]);

Kanon.register('vowel-ah', vowelAh);
```

---

## Helper Function

Create a general additive synthesizer:

```javascript
// In src/arche/kanon/helpers.js
export const additive = curry((partials, t) => {
  return partials.reduce((sum, partial) => {
    const { freq, amp } = partial;
    return sum + Math.sin(2 * Math.PI * freq * t) * amp;
  }, 0);
});

// Usage
const partials = [
  { freq: 110, amp: 1.0 },
  { freq: 220, amp: 0.5 },
  { freq: 330, amp: 0.33 },
  { freq: 440, amp: 0.25 }
];

Kanon.register('custom-additive',
  Kanon.additive(partials)
);
```

---

## Performance Considerations

### Limit Partial Count

More partials = more CPU:
- 8-16 partials: Efficient, good timbre
- 32-64 partials: Rich, more expensive
- 128+ partials: Overkill for most cases

### Precompute When Possible

```javascript
// Precompute partial data
const precomputed = Array.from({ length: 16 }, (_, n) => ({
  freq: 110 * (n + 1),
  amp: 1.0 / (n + 1),
  phase: 2 * Math.PI * 110 * (n + 1)
}));

const efficient = t => {
  return precomputed.reduce((sum, partial) => {
    return sum + Math.sin(partial.phase * t) * partial.amp;
  }, 0) * 0.1;
};
```

---

## Further Reading

- [Spectral Processing](spectral-processing.md) - Frequency domain techniques
- [Fourier Transform](../mathematical-foundations/fourier-transform.md) - Mathematical foundation
- [Harmonic Series](../mathematical-foundations/harmonic-series.md) - Theory of harmonics

---

**Next**: [Modulation Techniques](modulation.md) | [Delay & Feedback](delay-and-feedback.md)
