# ⚡ Zap - The Lightning Paradigm

> *ONE signature to rule them all*

## Philosophy

**Zap** is the unified synthesis paradigm that transcends artificial boundaries.

- 🔥 Pure time functions (Kanon)
- 🌍 Stateful evolution (Gaia)
- ✨ Spatial fields (Aether)
- **All in ONE**: `s => value`

## The Signature

```javascript
f(s) => value
```

Where **s** is "the state of the universe at this moment"

### Why s?

- **State** → Represents the state of everything
- **Simple** → Easy to type, works everywhere
- **No conflicts** → Doesn't clash with position coordinates (x, y, z)
- **Clean** → No parsing issues, maximum compatibility

## The State Object

```javascript
s = {
  // TIME
  t: 0,           // Absolute time (seconds)
  dt: 1/48000,    // Time delta

  // AUDIO
  idx: 0,         // Sample index
  sr: 48000,      // Sample rate

  // SPACE
  position: { x: 0, y: 0, z: 0 },

  // YOUR STATE
  // Add anything you need here
}
```

## Quick Start

### Installation

```javascript
import { Zap } from './src/arche/zap/indes.js';
```

### Simple Sine Wave

```javascript
const sine = s => Math.sin(2 * Math.PI * 440 * s.t);

const engine = Zap.createEngine();
const audio = engine.render(sine, 48000);  // 1 second
```

### With State

```javascript
const counter = s => {
  s.count = (s.count || 0) + 1;
  return Math.sin(2 * Math.PI * 440 * s.t) * (s.count / 1000);
};
```

### Spatial

```javascript
const field = s => {
  const { t, position: { x: posX, y: posY } } = x;
  const dist = Math.sqrt(x*x + y*y);
  return Math.sin(2 * Math.PI * 440 * t) / (dist + 1);
};

engine.setPosition({ x: 1, y: 2, z: 0 });
const spatial = engine.render(field, 48000);
```

## Composition

Everything has the same signature, so composition is natural:

```javascript
const bass = Zap.sine(110);
const lead = Zap.sine(440);
const pad = Zap.sine(660);

const music = s =>
  bass(⚡) * 0.5 +
  lead(⚡) * 0.3 +
  pad(⚡) * 0.2;
```

### Using Helpers

```javascript
const harmony = Zap.add(
  Zap.gain(Zap.sine(110), 0.5),
  Zap.gain(Zap.sine(220), 0.3),
  Zap.gain(Zap.sine(330), 0.2)
);
```

## Built-in Oscillators

```javascript
Zap.sine(freq)      // Sine wave
Zap.cosine(freq)    // Cosine wave
Zap.saw(freq)       // Sawtooth
Zap.square(freq)    // Square wave
Zap.triangle(freq)  // Triangle wave
Zap.noise()         // White noise
```

## Envelopes

```javascript
Zap.decay(rate)                    // Exponential decay
Zap.adsr(a, d, s, r)              // ADSR envelope
```

## Effects

```javascript
Zap.delay(signal, time)           // Simple delay
Zap.lowpass(signal, cutoff)       // Lowpass filter
Zap.softClip(signal, drive)       // Soft clipping
```

## Examples

### FM Synthesis

```javascript
const fm = s => {
  const mod = Math.sin(2 * Math.PI * 110 * s.t) * 5;
  return Math.sin(2 * Math.PI * 440 * s.t + mod);
};
```

### Karplus-Strong

```javascript
const pluck = s => {
  const freq = 220;
  const period = Math.floor(s.sr / freq);

  if (!s.buffer) {
    s.buffer = Array.from({ length: period },
      () => Math.random() * 2 - 1);
  }

  const idx = s.idx % period;
  const output = s.buffer[idx];

  const next = (idx + 1) % period;
  s.buffer[idx] = (s.buffer[idx] + s.buffer[next]) * 0.5 * 0.996;

  return output;
};
```

### Chaos

```javascript
const chaos = s => {
  s.x = s.x || 0.1;
  s.x = 3.9 * s.x * (1 - s.x);  // Logistic map

  return Math.sin(2 * Math.PI * 440 * s.x * s.t);
};
```

## API Reference

### Engine

```javascript
const engine = Zap.createEngine(options)
```

**Options:**
- `sampleRate` (default: 48000)
- `initialState` (default: {})

**Methods:**
- `render(fn, numSamples)` - Generate audio buffer
- `renderAtRate(fn, rate, duration)` - Variable rate rendering
- `sample(fn)` - Single value
- `reset(options)` - Reset state
- `setPosition({x, y, z})` - Set spatial position
- `seek(time)` - Jump to time

### Registration

```javascript
Zap.register(name, fn, options)  // Register signal
Zap.get(name)                    // Get signal
Zap.unregister(name)             // Remove signal
Zap.list()                       // List all signals
```

### Composition

```javascript
Zap.mix(...signals)              // Average signals
Zap.add(...signals)              // Sum signals
Zap.mul(...signals)              // Multiply signals
Zap.gain(signal, amount)         // Scale signal
Zap.map(signal, fn)              // Transform signal
Zap.pipe(...fns)                 // Compose functions
```

## Philosophy

### No Artificial Boundaries

Don't think in "paradigms" — think in **composition**.

- Need pure time? Use `s.t`
- Need state? Mutate `s.yourState`
- Need space? Use `s.position`

**All in one signature!**

### Pragmatic FP

The signature looks pure: `s => value`

But `x` is mutable! This is **pragmatic functional programming**:
- Pure when you want it (just read `x`)
- Stateful when you need it (mutate `x`)
- Best of both worlds

### Live Coding Friendly

```javascript
// Fast to type
play(s => Math.sin(2 * Math.PI * 440 * s.t));

// Easy to iterate
play(s => Math.sin(2 * Math.PI * 440 * s.t) * Math.exp(-s.t));

// Natural composition
const journey = s =>
  bass(⚡) + lead(⚡) + pad(⚡);
```

## Performance

Variable names have **zero runtime cost** in JavaScript!

After JIT compilation:
- `x`, `s`, `state`, `φ` all compile to identical machine code
- Variable names exist only at parse time
- Use the symbol you love without worry

Real bottlenecks:
1. Math operations (sin, cos, sqrt)
2. Memory allocation
3. Function call overhead
4. Cache misses

Variable names? Not even on the list!

## Running the Demo

```bash
bun run src/arche/zap/demo.js
```

## See Also

- [PARADIGM-DESIGN.md](../../../PARADIGM-DESIGN.md) - Full design philosophy
- [examples.js](./examples.js) - More examples
- [Elementary Audio](https://www.elementary.audio/) - Similar graph-based approach

---

**⚡ ONE signature, infinite possibilities! ⚡**
