# Universal Helpers - Working Across All Five Paradigms

> *These helpers work on ANY signal, regardless of its internal paradigm*

## The Power of `s => value`

Because all five paradigms share the unified signature, we can create helpers that transform signals **without caring** what's inside:

- 🔥 **Kanon** (Pure time) - `s => Math.sin(2 * Math.PI * 440 * s.t)`
- 🌍 **Rhythmos** (Stateful) - `s => { s.phase += ...; return Math.sin(s.phase); }`
- 💨 **Atomos** (Discrete) - `s => s.buffer[s.idx % period]`
- 💧 **Physis** (Physics) - `s => { s.x += s.v * s.dt; return s.x; }`
- ✨ **Aether** (Spatial) - `s => Math.sin(...) / (distance + 1)`

**The helpers don't care!** They just take `s => value` and return `s => transformedValue`.

---

## Examples Across All Paradigms

### 1. Gain (Amplitude Control)

Works on **any** signal:

```javascript
import { Zap } from './src/arche/zap/index.js';

// Kanon (pure time)
const kanon = s => Math.sin(2 * Math.PI * 440 * s.t);
Zap.register('kanon-quiet', Zap.gain(kanon, 0.2));

// Rhythmos (stateful)
const rhythmos = s => {
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 220 / s.sr) % 1.0;
  return Math.sin(s.phase * 2 * Math.PI);
};
Zap.register('rhythmos-quiet', Zap.gain(rhythmos, 0.2));

// Physis (Van der Pol oscillator)
const physis = s => {
  if (!s.vdp) s.vdp = { x: 0.1, y: 0.1 };
  const dx = s.vdp.y;
  const dy = 1.5 * (1 - s.vdp.x * s.vdp.x) * s.vdp.y - s.vdp.x;
  s.vdp.x += dx * 0.12;
  s.vdp.y += dy * 0.12;
  return s.vdp.x;
};
Zap.register('physis-quiet', Zap.gain(physis, 0.2));

// Works on ALL of them!
```

### 2. Lowpass Filter

**Same filter code** works on every paradigm:

```javascript
// Filter a pure time function
const kanon = s => Math.sin(2 * Math.PI * 440 * s.t);
const filteredKanon = Zap.lowpass(kanon, 800);

// Filter a Karplus-Strong string (Atomos)
const pluck = s => {
  const freq = 220;
  const period = Math.floor(s.sr / freq);
  if (!s.buffer) {
    s.buffer = Array.from({ length: period }, () => Math.random() * 2 - 1);
  }
  const idx = s.idx % period;
  const output = s.buffer[idx];
  const next = (idx + 1) % period;
  s.buffer[idx] = (s.buffer[idx] + s.buffer[next]) * 0.5 * 0.996;
  return output;
};
const filteredPluck = Zap.lowpass(pluck, 1200);

// Filter a Lorenz attractor (Physis/Chaos)
const lorenz = s => {
  if (!s.lorenz) s.lorenz = { x: 0.1, y: 0.1, z: 0.1 };
  const dx = 10 * (s.lorenz.y - s.lorenz.x);
  const dy = s.lorenz.x * (28 - s.lorenz.z) - s.lorenz.y;
  const dz = s.lorenz.x * s.lorenz.y - (8/3) * s.lorenz.z;
  s.lorenz.x += dx * 0.005;
  s.lorenz.y += dy * 0.005;
  s.lorenz.z += dz * 0.005;
  return s.lorenz.x;
};
const filteredLorenz = Zap.lowpass(lorenz, 600);

// Same filter, different paradigms!
```

### 3. Feedback Delay

Creates echoes regardless of source:

```javascript
// Echo a pure sine (Kanon)
const sine = s => Math.sin(2 * Math.PI * 220 * s.t);
const echoPure = Zap.feedbackDelay(sine, 0.3, 0.6);

// Echo a spatial field (Aether)
const spatial = s => {
  const { x, y, z } = s.position;
  const distance = Math.sqrt(x*x + y*y + z*z);
  return Math.sin(2 * Math.PI * 440 * s.t) / (distance + 1);
};
const echoSpatial = Zap.feedbackDelay(spatial, 0.5, 0.4);

// Same delay algorithm!
```

### 4. Crossfade Between Paradigms

**Mix different paradigms seamlessly:**

```javascript
// Crossfade from Kanon to Physis
const kanon = s => Math.sin(2 * Math.PI * 440 * s.t);

const physis = s => {
  if (!s.spring) s.spring = { position: 0, velocity: 10 };
  const force = -100 * s.spring.position - 0.1 * s.spring.velocity;
  s.spring.velocity += force * s.dt;
  s.spring.position += s.spring.velocity * s.dt;
  return s.spring.position;
};

// Crossfade over 5 seconds
const morphing = Zap.crossfade(kanon, physis, s => Math.min(1, s.t / 5));

Zap.register('morph', s => morphing(s) * 0.2);
```

### 5. Tremolo (Works Everywhere)

```javascript
// Tremolo on any signal
const anySignal = s => /* ... any paradigm ... */;
const trembling = Zap.tremolo(anySignal, 4, 0.5); // 4 Hz, 50% depth
```

---

## Chaining Helpers (Pipe Pattern)

Stack multiple transformations:

```javascript
import { Zap } from './src/arche/zap/index.js';

// Start with ANY paradigm
const source = s => {
  // Could be Kanon, Rhythmos, Atomos, Physis, or Aether
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 330 / s.sr) % 1.0;
  return s.phase * 2 - 1; // Sawtooth
};

// Chain transformations
const processed = Zap.pipe(
  source,
  sig => Zap.lowpass(sig, 1200),      // Filter
  sig => Zap.feedbackDelay(sig, 0.25, 0.4), // Echo
  sig => Zap.tremolo(sig, 3, 0.3),    // Tremolo
  sig => Zap.softClip(sig, 1.5),      // Soft clip
  sig => Zap.gain(sig, 0.3)           // Final gain
);

Zap.register('chain', processed);
```

---

## Parallel Processing

Apply multiple effects in parallel:

```javascript
const source = s => Math.sin(2 * Math.PI * 220 * s.t);

// Three parallel paths
const dry = source;
const filtered = Zap.lowpass(source, 800);
const delayed = Zap.feedbackDelay(source, 0.5, 0.5);

// Mix them
const parallel = Zap.mix(
  Zap.gain(dry, 0.4),
  Zap.gain(filtered, 0.3),
  Zap.gain(delayed, 0.3)
);

Zap.register('parallel', parallel);
```

---

## Modulation Between Paradigms

Use one paradigm to modulate another:

```javascript
// Chaos modulates frequency of pure sine
const lorenzLFO = s => {
  if (!s.lorenz) s.lorenz = { x: 0.1, y: 0.1, z: 0.1 };
  // ... Lorenz equations ...
  return s.lorenz.x * 20 + 440; // 440 Hz ± 20 Hz
};

const modulatedSine = s => {
  const freq = lorenzLFO(s);
  return Math.sin(2 * Math.PI * freq * s.t);
};

// Stateful oscillator modulates pure time function
const rhythmosLFO = s => {
  if (!s.lfo) s.lfo = 0;
  s.lfo = (s.lfo + 0.5 / s.sr) % 1.0;
  return Math.sin(s.lfo * 2 * Math.PI) * 0.5 + 0.5; // 0-1 range
};

const crossfaded = Zap.crossfade(
  s => Math.sin(2 * Math.PI * 220 * s.t),
  s => Math.sin(2 * Math.PI * 440 * s.t),
  rhythmosLFO  // Rhythmos controlling crossfade!
);
```

---

## Spatial Processing (Aether + Helpers)

Helpers work on spatial fields:

```javascript
// Spatial field with distance attenuation
const spatialField = s => {
  const { x, y, z } = s.position;
  const distance = Math.sqrt(x*x + y*y + z*z);
  return Math.sin(2 * Math.PI * 440 * s.t) / (distance + 1);
};

// Add echo to spatial field
const echoingSpatial = Zap.feedbackDelay(spatialField, 0.3, 0.6);

// Filter spatial field
const filteredSpatial = Zap.lowpass(spatialField, 1000);

// Pan spatial field based on X position
const pannedSpatial = Zap.pan(spatialField, s => s.position.x / 10);

Zap.register('spatial-echo', echoingSpatial);
```

---

## Complete Example: All Five Paradigms

```javascript
import { Zap } from './src/arche/zap/index.js';

// 1. Kanon (Fire) - Pure time
const fire = s => Math.sin(2 * Math.PI * 440 * s.t);

// 2. Rhythmos (Earth) - Stateful
const earth = s => {
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 220 / s.sr) % 1.0;
  return Math.sin(s.phase * 2 * Math.PI);
};

// 3. Atomos (Air) - Karplus-Strong
const air = s => {
  const period = 109; // ~440 Hz at 48kHz
  if (!s.buffer) {
    s.buffer = Array.from({ length: period }, () => Math.random() * 2 - 1);
  }
  const idx = s.idx % period;
  const output = s.buffer[idx];
  const next = (idx + 1) % period;
  s.buffer[idx] = (s.buffer[idx] + s.buffer[next]) * 0.5 * 0.996;
  return output;
};

// 4. Physis (Water) - Van der Pol
const water = s => {
  if (!s.vdp) s.vdp = { x: 0.1, y: 0.1 };
  const dx = s.vdp.y;
  const dy = 1.5 * (1 - s.vdp.x * s.vdp.x) * s.vdp.y - s.vdp.x;
  s.vdp.x += dx * 0.12;
  s.vdp.y += dy * 0.12;
  return s.vdp.x;
};

// 5. Aether (Ether) - Spatial
const aether = s => {
  const { x, y, z } = s.position;
  const distance = Math.sqrt(x*x + y*y + z*z);
  return Math.sin(2 * Math.PI * 330 * s.t) / (distance + 1);
};

// Apply SAME transformation to ALL five paradigms
const fireProcessed = Zap.pipe(
  fire,
  sig => Zap.lowpass(sig, 1000),
  sig => Zap.tremolo(sig, 4, 0.3),
  sig => Zap.gain(sig, 0.15)
);

const earthProcessed = Zap.pipe(
  earth,
  sig => Zap.lowpass(sig, 1000),
  sig => Zap.tremolo(sig, 4, 0.3),
  sig => Zap.gain(sig, 0.15)
);

// ... same for air, water, aether

// Mix all five paradigms together
const elements = Zap.mix(
  fireProcessed,
  earthProcessed,
  // air, water, aether...
);

Zap.register('five-elements', elements);
```

---

## Available Helpers

### Amplitude
- `gain(signal, amount)` - Scale amplitude
- `clip(signal)` - Hard clip to [-1, 1]
- `softClip(signal, drive)` - Tanh soft clipping
- `normalize(signal, target)` - Auto-gain to peak
- `fadeIn(signal, duration)` - Fade in
- `fadeOut(signal, duration)` - Fade out
- `crossfade(sigA, sigB, mix)` - Crossfade between two signals

### Mixing
- `mix(...signals)` - Average multiple signals
- `add(...signals)` - Sum signals
- `mul(...signals)` - Ring modulation
- `pipe(signal, ...transforms)` - Serial processing

### Filtering
- `lowpass(signal, cutoff)` - One-pole lowpass
- `highpass(signal, cutoff)` - One-pole highpass
- `biquad(signal, type, freq, Q, gain)` - Full biquad filter
- `dcBlock(signal)` - Remove DC offset

### Delay & Feedback
- `delay(signal, time)` - Simple delay
- `feedbackDelay(signal, time, feedback)` - Echo/reverb
- `chorus(signal, rate, depth, mix)` - Chorus effect

### Modulation
- `am(carrier, modulator, depth)` - Amplitude modulation
- `fm(carrier, modulator, index)` - Frequency modulation
- `tremolo(signal, rate, depth)` - Amplitude LFO

### Spatial
- `pan(signal, position)` - Stereo panning
- `stereoWidth(left, right, width)` - Width control

### Analysis
- `meter(signal, attack, release)` - Peak meter
- `rms(signal, windowSize)` - RMS level

### Effects
- `bitcrush(signal, bits, sampleRateReduction)` - Lo-fi
- `sampleHold(signal, rate)` - Sample & hold
- `quantize(signal, step)` - Quantize values

### Utility
- `map(signal, fn)` - Transform values

---

## Philosophy

These helpers embody the **essence of Zap**:

> *One signature to rule them all*

You don't need separate filter implementations for Kanon, Rhythmos, Atomos, Physis, and Aether. **One implementation works for all.**

This is the power of abstraction. The paradigms are **unified**, not **isolated**.

---

## Performance Note

These helpers use Symbol keys for state, so multiple instances don't conflict:

```javascript
const sig1 = Zap.lowpass(source, 800);  // Symbol('lowpass_z1')
const sig2 = Zap.lowpass(source, 1200); // Different Symbol('lowpass_z1')

// No state collision! Each has its own filter memory.
```

This is slightly less efficient than manual state management with explicit keys, but the composability is worth it for most use cases.

For ultra-performance-critical code, use manual state management as shown in zap-patterns.md.

---

## See Also

- [Zap Patterns](./zap-patterns.md) - Paradigm-specific patterns
- [Zap README](../../src/arche/zap/README.md) - Core API
- [PARADIGM-DESIGN.md](../../PARADIGM-DESIGN.md) - Design philosophy
