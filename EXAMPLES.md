# Signal API Examples

Complete guide to the Signal API with examples.

---

## Quick Examples

### Simple Tone

```javascript
const signal = require('./signal');

// Simple sine wave
signal('tone').sin(432).gain(0.2);
```

### Distorted Bass

```javascript
signal('bass').sin(110)
  .fx(sample => Math.tanh(sample * 3))
  .gain(0.3);
```

### Tremolo (AM)

```javascript
const lfo = signal.sin(3).gain(0.5).offset(0.5);
signal('tremolo').sin(440).modulate(lfo).gain(0.2);
```

### Chord

```javascript
signal('chord').sin(432)
  .mix(signal.sin(540), signal.sin(648))
  .gain(0.15);
```

---

## Melodic Sequencing

```javascript
const { step } = require('./signal/rhythm');
const { freq } = require('./signal/melody');
const { env } = require('./signal/envelopes');
const scales = require('./signal/scales');

signal('melody').fn(t => {
  const { index, phase } = step(t, 120, 8);  // 8th notes at 120 BPM
  const pattern = [0, 2, 4, 2, 5, 4, 2, 0];  // Scale degrees
  const degree = pattern[index % pattern.length];

  const f = freq(432, scales.major, degree);
  const envelope = env.exp(phase, 5);  // Exponential decay

  return signal.sin(f).eval(t) * envelope * 0.2;
});
```

---

## Rhythmic Patterns

### Step Sequencer

```javascript
const { step } = require('./signal/rhythm');

signal('kick').fn(t => {
  const { index, phase } = step(t, 128, 16);  // 16th notes
  const pattern = [1, 0, 0, 0, 1, 0, 0, 0];   // Kick pattern

  if (!pattern[index % pattern.length]) return 0;
  if (phase > 0.3) return 0;  // Short trigger

  const f = 60 + 50 * Math.exp(-15 * phase);  // Pitch envelope
  return signal.sin(f).eval(t) * Math.exp(-8 * phase) * 0.4;
});
```

### Euclidean Rhythm

```javascript
const { step, euclidean } = require('./signal/rhythm');

const pattern = euclidean(5, 16);  // 5 pulses in 16 steps

signal('euclid').fn(t => {
  const { index, phase } = step(t, 120, 16);

  if (!pattern[index % pattern.length]) return 0;

  return signal.sin(432).eval(t) * Math.exp(-8 * phase) * 0.3;
});
```

---

## Effects

### Custom Distortion

```javascript
signal('distorted').sin(110)
  .fx(sample => Math.tanh(sample * 3))  // Soft clipping
  .gain(0.3);
```

### Wavefolder

```javascript
signal('folded').square(220)
  .fold(0.7)  // Fold threshold
  .gain(0.25);
```

### Hard Clipping

```javascript
signal('clipped').sin(110)
  .gain(4)      // Drive
  .clip(0.8)    // Clip threshold
  .gain(0.3);   // Output gain
```

### Time-Varying Effect

```javascript
signal('evolving').sin(440)
  .fx((sample, t) => {
    const depth = Math.sin(2 * Math.PI * 0.2 * t);  // Slow LFO
    return Math.tanh(sample * (1 + depth * 3));
  })
  .gain(0.2);
```

---

## Imperative Programming

### Generate Chord with Loop

```javascript
const chordDegrees = [0, 4, 7, 11];  // Major 7th
const scales = require('./signal/scales');
const { freq } = require('./signal/melody');

for (let i = 0; i < chordDegrees.length; i++) {
  const f = freq(200, scales.major, chordDegrees[i]);
  signal(`chord-${i}`).sin(f).gain(0.12);
}
```

### Build Harmonics

```javascript
const fundamental = 110;
const harmonics = [];

for (let n = 1; n <= 8; n++) {
  harmonics.push(
    signal.sin(fundamental * n).gain(1 / n)
  );
}

signal('rich').fn(signal.mix(...harmonics).gain(0.2));
```

### Array Methods

```javascript
const frequencies = [100, 150, 200, 250, 300];

const layers = frequencies
  .filter((f, i) => i % 2 === 0)  // Odd harmonics
  .map((f, i) => signal.sin(f).gain(0.05 / (i + 1)));

signal('texture').fn(signal.mix(...layers));
```

### Conditional Patterns

```javascript
const { step } = require('./signal/rhythm');

signal('evolving').fn(t => {
  const { beat, index, phase } = step(t, 120, 8);

  let pattern;
  if (Math.floor(beat / 8) % 2 === 0) {
    pattern = [0, 2, 4, 5];  // Major
  } else {
    pattern = [0, 3, 5, 7];  // Minor
  }

  const degree = pattern[index % pattern.length];
  const f = freq(330, scales.major, degree);

  return signal.sin(f).eval(t) * env.exp(phase, 6) * 0.15;
});
```

---

## JavaScript Patterns for Live Coding

Signal leverages JavaScript itself for live coding - no special syntax needed. Here are patterns that make performances dynamic:

### Array Indexing for Value Cycling

```javascript
// Cycle through frequencies every 5 seconds
const freq = [440, 550, 660][Math.floor(Date.now() / 5000) % 3];
signal('cycling').sin(freq).gain(0.2);
```

How it works:
- `[440, 550, 660]` - array of values
- `[Math.floor(Date.now() / 5000) % 3]` - index that cycles 0→1→2
- `Date.now()` - milliseconds since 1970
- `/ 5000` - divide into 5-second chunks
- `% 3` - modulo gives 0, 1, or 2

### Ternary Operators for Quick Switching

```javascript
// Switch between two sounds based on time
const freq = Date.now() % 10000 < 5000 ? 440 : 220;
signal('toggle').sin(freq).gain(0.2);

// Conditional effects
signal('dynamic').sin(330)
  .fx(sample => Date.now() % 8000 < 4000
    ? Math.tanh(sample * 3)  // Distorted
    : sample)                 // Clean
  .gain(0.2);
```

### Template Literals for Dynamic Names

```javascript
// Generate multiple variations
const variations = 3;
for (let i = 0; i < variations; i++) {
  const detune = i * 5;  // Detune by 5 Hz each
  signal(`layer-${i}`).sin(440 + detune).gain(0.1);
}
```

### Live Value Exploration

Instead of SuperCollider's Ctrl+Enter on individual lines, use comments:

```javascript
// Try different values by uncommenting:
const freq = 440;
// const freq = 550;
// const freq = 660;

signal('tone').sin(freq).gain(0.2);

// Or use an array and change the index:
const freqs = [440, 550, 660, 880];
signal('tone').sin(freqs[0]).gain(0.2);  // Change 0 to 1, 2, 3...
```

### Time-Based Patterns Without Hot Reload

```javascript
// Pattern evolves automatically based on clock time
signal('evolving', t => {
  const second = Math.floor(Date.now() / 1000);
  const freq = [200, 300, 400, 500][second % 4];
  return Math.sin(2 * Math.PI * freq * t) * 0.2;
});

// Different sound every 10 seconds
const waveforms = [
  t => Math.sin(2 * Math.PI * 440 * t),      // Sine
  t => Math.sign(Math.sin(2 * Math.PI * 440 * t)),  // Square
  t => (440 * t % 1) * 2 - 1                 // Saw
];
const wave = waveforms[Math.floor(Date.now() / 10000) % 3];
signal('morphing', wave).gain(0.2);
```

### Combining Patterns

```javascript
// Everything you know about JavaScript just works:
const scales = [
  [0, 2, 4, 5, 7, 9, 11],  // Major
  [0, 2, 3, 5, 7, 8, 10],  // Minor
  [0, 2, 4, 7, 9]          // Pentatonic
];

const scaleIndex = Math.floor(Date.now() / 8000) % scales.length;
const scale = scales[scaleIndex];
const degree = scale[Math.floor(Date.now() / 1000) % scale.length];

signal('smart').sin(440 * Math.pow(2, degree / 12)).gain(0.2);
```

---

## Live Performance

```javascript
// Create layers
const layers = {
  bass: signal('bass').sin(110).gain(0.3),
  arp: signal('arp').sin(440).gain(0.2).stop(),
  pad: signal('pad').sin(220).gain(0.15).stop(),
  kick: signal('kick').sin(60).gain(0.4)
};

// Toggle during performance (edit and save file)
layers.arp.play();   // Bring in arp
layers.pad.play();   // Bring in pad
layers.bass.stop();  // Remove bass
```

---

## Run Examples

```bash
# Builder style basics
node builder-session.js

# Imperative programming
node imperative-session.js

# Live performance template (with hot reload)
node runner.js performance-session.js

# Live coding example
node runner.js example-session.js
```
