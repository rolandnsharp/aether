# FLUX - Live Sound Surgery Engine

> *"Panta Rhei" (Everything Flows) - Heraclitus*

A state-driven live-coding environment for sound synthesis. Edit JavaScript, save, and hear changes instantly with **zero phase resets**. True surgical manipulation of living sound.

## Philosophy

Flux embodies **Heraclitean flow** - sound as a continuous river of state transformations. Unlike traditional `f(t)` synthesis, Flux treats signals as **living processes with momentum and memory**. When you edit parameters, the signal morphs seamlessly because its state persists across code changes.

This is the companion to [Kanon](https://github.com/yourname/kanon) (Pythagorean absolute `f(t)` mathematics).

## Quick Start

```bash
# Install dependencies
bun install

# Start the engine (with hot-reload)
bun --hot index.js

# Edit signals.js while running for live surgery!
```

## Architecture

```
┌───────────────────────────────────────────┐
│  signals.js - Live Coding Interface       │  ← Edit this!
├───────────────────────────────────────────┤
│  flux.js - Signal Registry (FRP)          │  ← State transformers
├───────────────────────────────────────────┤
│  storage.js - Ring Buffer (The Well)      │  ← SharedArrayBuffer
├───────────────────────────────────────────┤
│  transport.js - Audio Sink                │  ← Speaker.js → JACK FFI
├───────────────────────────────────────────┤
│  engine.js - Producer Loop                │  ← setImmediate saturation
└───────────────────────────────────────────┘
```

### Key Features

- **Phase Continuity**: State persists in `globalThis.FLUX_STATE` during hot-reload
- **Zero-Copy Architecture**: `subarray()` eliminates GC pauses
- **Soft Clipping**: All signals auto-clipped with `Math.tanh()` for safety
- **48kHz @ 32-bit float**: Native floating-point audio (no int16 quantization)
- **Functional Purity**: Pure state transformers (state → nextState → sample)
- **Dimension Agnostic**: STRIDE=1 (mono) now, upgradable to stereo/3D later

## Basic Usage

### Simple Sine Wave

```javascript
import { flux } from './flux.js';

flux('carrier', (mem, idx) => {
  const freq = 440.0; // Change this and save - NO CLICKS!

  return {
    update: (sr) => {
      // Read-modify-write pattern
      mem[idx] = (mem[idx] + freq / sr) % 1.0;

      // Emit sample
      return [Math.sin(mem[idx] * 2 * Math.PI) * 0.5];
    }
  };
});
```

### Vortex Morph (Phase Modulation)

```javascript
flux('vortex-morph', (mem, idx) => {
  // --- SURGERY PARAMS (change these live!) ---
  const baseFreq = 110.0;      // Deep G2 note
  const modRatio = 1.618;      // Golden Ratio
  const morphSpeed = 0.2;      // Breathe rate (Hz)
  const intensity = 6.0;       // 0.0 = sine, 50.0 = chaos

  return {
    update: (sr) => {
      // Accumulate three phases
      let p1 = mem[idx];         // Carrier
      let p2 = mem[idx + 1];     // Modulator
      let t  = mem[idx + 2];     // LFO

      p1 = (p1 + baseFreq / sr) % 1.0;
      p2 = (p2 + (baseFreq * modRatio) / sr) % 1.0;
      t  = (t + morphSpeed / sr) % 1.0;

      mem[idx] = p1;
      mem[idx + 1] = p2;
      mem[idx + 2] = t;

      // Phase modulation
      const depthLFO = Math.sin(t * 2 * Math.PI) * intensity;
      const modulator = Math.sin(p2 * 2 * Math.PI) * depthLFO;
      const sample = Math.sin(p1 * 2 * Math.PI + modulator);

      return [sample * 0.5];
    }
  };
});
```

### Van der Pol Oscillator

```javascript
const vanDerPolStep = (state, { mu, dt }) => {
  const [x, y] = state;
  const dx = y;
  const dy = mu * (1 - x * x) * y - x;
  return [x + dx * dt, y + dy * dt];
};

flux('van-der-pol', (mem, idx) => {
  // --- SURGERY PARAMETERS ---
  const params = { mu: 1.5, dt: 0.12 };

  // Initialize if empty
  if (mem[idx] === 0) {
    mem[idx] = 0.1;
    mem[idx + 1] = 0.1;
  }

  return {
    update: () => {
      // Pure functional state transformation
      const current = [mem[idx], mem[idx + 1]];
      const [nextX, nextY] = vanDerPolStep(current, params);

      // Commit to persistent memory
      mem[idx] = nextX;
      mem[idx + 1] = nextY;

      // Emit (X is the signal)
      return [nextX * 0.4];
    }
  };
});
```

## Live Surgery Workflow

1. **Start Flux**: `bun --hot index.js`
2. **Open** `signals.js` in your editor
3. **Edit** a parameter (e.g., `intensity = 6.0` → `intensity = 12.0`)
4. **Save** (`:w` in Vim)
5. **Hear it morph instantly** with zero discontinuity

### Why It Works

When you save `signals.js`:
1. Bun reloads the module
2. The old signal registry is cleared
3. New `flux()` calls register fresh closures with updated parameters
4. **State in `globalThis.FLUX_STATE` is untouched**
5. Signal continues from exact phase position with new math

This is **phase-continuous hot-swapping**.

## State Management

### Persistent State Buffer

```javascript
globalThis.FLUX_STATE ??= new Float64Array(1024);
```

Each signal gets a deterministic slot via string hash:

```javascript
flux('my-signal', (mem, idx) => {
  // You get ~3-4 slots typically
  mem[idx]     // First variable (e.g., phase)
  mem[idx + 1] // Second variable (e.g., LFO)
  mem[idx + 2] // Third variable (e.g., envelope)
  // ...
});
```

**Critical**: State survives hot-reload! This is why oscillators don't click or reset phase when you change parameters.

## API Reference

### Core Functions

#### `flux(id, factory)`
Register a signal for live surgery.

- **id** (string): Unique identifier
- **factory** (function): `(mem, idx) => { update: (sr) => [samples...] }`
- **Returns**: Signal object

#### `updateAll(sampleRate)`
Mix all registered signals and apply soft clipping.

- **sampleRate** (number): Sample rate (e.g., 48000)
- **Returns**: Array of mixed samples

#### `clear()`
Remove all registered signals. (Called automatically on hot-reload)

#### `list()`
Get array of all registered signal IDs.

#### `remove(id)`
Remove a specific signal by ID.

## Files

- **index.js** - Entry point, console interface
- **engine.js** - Producer loop, lifecycle management
- **flux.js** - Signal registry & mixing logic
- **storage.js** - Ring buffer (SharedArrayBuffer)
- **transport.js** - Audio output (speaker.js)
- **signals.js** - **YOUR CODE** - Live-codeable signal definitions
- **math-helpers.js** - Vector math utilities (optional)

## Technical Details

- **Runtime**: Bun with `--hot` flag for hot-reload
- **Audio**: speaker.js (48kHz @ 32-bit float)
- **State Memory**: Float64Array (1024 slots, sub-sample precision)
- **Ring Buffer**: SharedArrayBuffer (32768 frames, ~680ms @ 48kHz)
- **Producer Loop**: `setImmediate` saturation for maximum throughput
- **Soft Clipping**: `Math.tanh()` on mixed output

## Why This Architecture?

### vs. Traditional `f(t)` Synthesis

Traditional systems evaluate `f(t)` - a pure function of time:

```javascript
// Can't do live surgery - restarting resets t
const sample = Math.sin(t * 2 * Math.PI * freq);
```

Flux uses `f(state)` - recursive state transformations:

```javascript
// Phase persists across parameter changes
mem[idx] = (mem[idx] + freq / sr) % 1.0;
const sample = Math.sin(mem[idx] * 2 * Math.PI);
```

### vs. Lisp/Incudine

See [DOCS/BEYOND-LISP.md](DOCS/BEYOND-LISP.md) for philosophical comparison.

**Key advantages**:
- No RT kernel requirement
- Unified memory (audio + visualization)
- JIT optimization (adaptive runtime compilation)
- Web-native deployment
- NPM ecosystem access

### vs. Modular Synthesizers (The Philosophical Ancestor)

The `f(state)` paradigm is the software embodiment of hardware modular synthesis (e.g., Eurorack).

- **A Modular Patch is a Stateful System**: The state is physical—voltages held in capacitors, the position of knobs, the flow of current. The system is always "on."
- **Turning a Knob is Live Surgery**: When you patch a cable or turn a knob, you are altering a parameter within a continuously running process. You don't "restart" the sound; you guide its flow.

Flux models this behavior directly in code. The `FLUX_STATE` buffer is the rack's power supply and memory. Your `signals.js` file is the patch itself. Editing a parameter is the digital equivalent of turning a knob on a living instrument.

## Documentation

- **[SURGERY_GUIDE.md](DOCS/SURGERY_GUIDE.md)** - Live coding workflow and best practices
- **[BEYOND-LISP.md](DOCS/BEYOND-LISP.md)** - How Flux transcends Lisp/Incudine
- **[KANON-FLUX-DUALITY.md](DOCS/KANON-FLUX-DUALITY.md)** - Philosophical foundation

## Roadmap

- [x] Core FRP architecture with closures
- [x] Phase-continuous hot-swapping
- [x] 48kHz @ 32-bit float audio
- [x] Zero-copy buffer optimization
- [x] Soft clipping with tanh()
- [ ] Stereo support (STRIDE=2)
- [ ] JACK FFI transport (PULL mode, <10ms latency)
- [ ] 3D oscilloscope integration (STRIDE=4: XYZW)
- [ ] Vim eval integration (select → send → eval)

## Credits

Inspired by:
- Incudine (Common Lisp DSP)
- SuperCollider (live coding pioneer)
- TidalCycles (pattern-based live coding)
- Max/MSP (dataflow paradigm)

Built with:
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [speaker](https://github.com/TooTallNate/node-speaker) - Node.js audio output

## License

MIT

---

*"You can't step in the same river twice, but you can change its current while standing in it."* - Flux Engineering Principle
