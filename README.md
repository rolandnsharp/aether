# Aether - Multi-Paradigm Live Coding Engine

> *"All things are number."* - Pythagoras

A multi-paradigm live-coding environment for sound synthesis. Edit JavaScript, save, and hear changes instantly with **zero phase resets**. True surgical manipulation of living sound across five fundamental synthesis paradigms.

## Philosophy

**Aether** (Gr. Αἰθήρ) embodies the classical element that fills the universe, the pure essence that conveys all phenomena. Like the theoretical medium through which waves propagate, this engine treats your state array as the fabric of a sonic universe that never stops.

When you edit parameters, the sonic medium morphs seamlessly because its state persists across code changes. The monochord's string continues vibrating; only the tension changes.

**See [docs/AETHER_PARADIGMS.md](docs/AETHER_PARADIGMS.md) for the full design philosophy and the Five Elements.**

## The Five Paradigms (Arche)

Aether supports five fundamental synthesis paradigms, each representing a different level of abstraction:

| Paradigm | Element | Signature | Concept |
|----------|---------|-----------|---------|
| **Rhythmos** | Earth 🌍 | `f(state, sr)` | Explicit state management |
| **Kanon** | Fire 🔥 | `f(t)` | Pure functions of time |
| **Atomos** | Air 💨 | `f(state, dt)` | Discrete generative processes |
| **Physis** | Water 💧 | `flow(state)` | Physics simulation |
| **Chora** | Aether ✨ | `field(state)` | Spatial resonance fields |

Currently, **Rhythmos** is fully implemented. The others are coming soon.

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Link commands globally (one-time setup)
bun link

# 3. Start the live sound engine in a terminal
aether                    # Loads live-session.js (default)
aether my-session.js      # Load a custom session file

# 4. In a separate terminal, send commands or start a REPL
aether-client send my-session.js  # Send a whole file
aether-client repl                # Start an interactive REPL

# The traditional hot-reload method still works too:
bun --hot src/index.js
```

The `aether` command starts the server. You can then interact with it using `aether-client` for surgical code injection, or rely on Bun's hot-reloading by editing your session file.

## Architecture

```
┌───────────────────────────────────────────┐
│  live-session.js - Live Coding Interface  │  ← Edit this!
├───────────────────────────────────────────┤
│  src/arche/                               │
│    ├── rhythmos/ (Earth 🌍)              │  ← Paradigm modules
│    ├── kanon/ (Fire 🔥)                  │
│    ├── atomos/ (Air 💨)                  │
│    ├── physis/ (Water 💧)                │
│    └── chora/ (Aether ✨)                │
├───────────────────────────────────────────┤
│  aether.js - Signal Registry              │  ← Paradigm-agnostic mixer
├───────────────────────────────────────────┤
│  storage.js - Ring Buffer (The Well)      │  ← SharedArrayBuffer
├───────────────────────────────────────────┤
│  transport.js - Audio Sink                │  ← Speaker.js → JACK FFI
├───────────────────────────────────────────┤
│  engine.js - Producer Loop                │  ← setImmediate saturation
└───────────────────────────────────────────┘
```

### Key Features

- **Phase Continuity**: State persists in `globalThis.AETHER_STATE` during hot-reload
- **Multi-Paradigm**: Mix Earth (Rhythmos), Fire (Kanon), Air (Atomos), Water (Physis), and Aether (Chora)
- **Zero-Copy Architecture**: `subarray()` eliminates GC pauses
- **Soft Clipping**: All signals auto-clipped with `Math.tanh()` for safety
- **48kHz @ 32-bit float**: Native floating-point audio (no int16 quantization)
- **Stereo Support**: STRIDE=2 for full stereo output
- **Context-Based Updates**: All paradigms receive `{t, dt, sampleRate}` context

## Basic Usage (Rhythmos Paradigm)

### Simple Sine Wave

```javascript
import { Rhythmos } from './src/arche/rhythmos/index.js';

Rhythmos.register('carrier',
  Rhythmos.pipe(
    Rhythmos.sin(440),  // Change this and save - NO CLICKS!
    Rhythmos.gain(0.3)
  )
);
```

### Stereo Panning

```javascript
Rhythmos.register('panned-sine',
  Rhythmos.pipe(
    Rhythmos.sin(330),
    Rhythmos.gain(0.4),
    Rhythmos.pan(0.75)  // Pan to the right
  )
);
```

### Binaural Beat

```javascript
Rhythmos.register('binaural',
  Rhythmos.stereo(
    Rhythmos.pipe(Rhythmos.sin(432), Rhythmos.gain(0.3)),  // Left
    Rhythmos.pipe(Rhythmos.sin(434), Rhythmos.gain(0.3))   // Right (2Hz beat)
  )
);
```

### Complex Modulation

```javascript
Rhythmos.register('tremolo',
  Rhythmos.pipe(
    Rhythmos.am(
      Rhythmos.lfo(4)       // 4 Hz modulator
    )(
      Rhythmos.sin(440)     // 440 Hz carrier
    ),
    Rhythmos.gain(0.5)
  )
);
```

### Manual API (Advanced)

For more control, you can use the lower-level factory API:

```javascript
Rhythmos.register('vortex-morph', (mem, idx, sampleRate) => {
  // Your parameters
  const baseFreq = 110.0;
  const modRatio = 1.618;
  const morphSpeed = 0.2;
  const intensity = 6.0;

  return {
    update: (context) => {
      // Accumulate three phases
      let p1 = mem[idx];         // Carrier
      let p2 = mem[idx + 1];     // Modulator
      let t  = mem[idx + 2];     // LFO

      p1 = (p1 + baseFreq / sampleRate) % 1.0;
      p2 = (p2 + (baseFreq * modRatio) / sampleRate) % 1.0;
      t  = (t + morphSpeed / sampleRate) % 1.0;

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

## Live Surgery Workflows

Aether supports two primary workflows for live code manipulation.

### Method 1: Interactive REPL (Recommended)

This method uses `aether-client` to send small, surgical code snippets to the running server.

1.  **Start Server**: In one terminal, run `aether`.
2.  **Start REPL**: In a second terminal, run `aether-client repl`.
3.  **Evaluate Code**: Type JavaScript code into the REPL and press Enter.

```
aether> import { Rhythmos } from './src/arche/rhythmos/index.js';
Sent successfully.
aether> Rhythmos.register('noise', () => ({ update: () => [Math.random() * 0.1] }))
Sent successfully.
aether> import { clear } from './src/aether.js'; clear()
Sent successfully.
```

You can also send an entire file: `aether-client send my-session.js`.

### Method 2: File-Based Hot-Reload

Classic workflow, powered by Bun's `--hot` flag.

1.  **Start Aether with Hot-Reload**: `bun --hot src/index.js`
2.  **Open** `live-session.js` in your editor.
3.  **Edit** a parameter (e.g., `Rhythmos.sin(440)` → `Rhythmos.sin(550)`).
4.  **Save** (`:w` in Vim).
5.  **Hear it morph instantly** with zero discontinuity.

### Why It Works

When you send code via the REPL or save a file with hot-reload:
1.  The new code is evaluated.
2.  The signal registry is updated with new closures.
3.  **State in `globalThis.AETHER_STATE` is untouched.**
4.  The audio signal continues from its exact phase position, but with new parameters.

This is **phase-continuous hot-swapping** - like adjusting a monochord's string tension while it's still vibrating.

## State Management

### Persistent State Buffer

```javascript
globalThis.AETHER_STATE ??= new Float64Array(1024);
```

Each signal gets a deterministic slot via string hash. Your state survives hot-reload, which is why oscillators don't click or reset phase when you change parameters.

## Rhythmos API Reference

### Registration

```javascript
Rhythmos.register(id, factory)
```

### Oscillators

- `Rhythmos.sin(freq)` - Sine wave
- `Rhythmos.saw(freq)` - Sawtooth
- `Rhythmos.square(freq)` - Square wave
- `Rhythmos.tri(freq)` - Triangle wave
- `Rhythmos.lfo(freq)` - Low-frequency oscillator (0-1 range)

### Processors

- `Rhythmos.gain(amount)` - Multiply signal
- `Rhythmos.offset(amount)` - Add constant
- `Rhythmos.clip()` - Hard clip to [-1, 1]
- `Rhythmos.softClip()` - Soft clip with tanh

### Stereo

- `Rhythmos.pan(position)` - Pan mono to stereo (0=left, 1=right)
- `Rhythmos.stereo(leftSig, rightSig)` - Combine two mono signals
- `Rhythmos.mono()` - Mix down to mono
- `Rhythmos.spread()` - Duplicate mono to stereo

### Mixing

- `Rhythmos.mix(...signals)` - Mix multiple signals
- `Rhythmos.add(sigA, sigB)` - Add two signals

### Modulation

- `Rhythmos.am(modulator)(carrier)` - Amplitude modulation

### Effects

- `Rhythmos.feedback(delayTime, feedbackAmt)` - Delay with feedback

### Composition

- `Rhythmos.pipe(...functions)` - Left-to-right composition
- `Rhythmos.compose(...functions)` - Right-to-left composition

## Core API

These functions are available from `aether.js`:

### `clear()`
Remove all registered signals.

### `list()`
Get array of all registered signal IDs.

### `remove(id)`
Remove a specific signal by ID.

## Files

- **src/index.js** - Entry point
- **src/engine.js** - Producer loop, lifecycle management
- **src/aether.js** - Paradigm-agnostic signal registry & mixer
- **src/storage.js** - Ring buffer (SharedArrayBuffer)
- **src/transport.js** - Audio output (speaker.js)
- **src/arche/** - Paradigm-specific modules
  - **rhythmos/** - Earth 🌍 (explicit state)
  - **kanon/** - Fire 🔥 (pure time functions) - *Coming soon*
  - **atomos/** - Air 💨 (discrete processes) - *Coming soon*
  - **physis/** - Water 💧 (physics simulation) - *Coming soon*
  - **chora/** - Aether ✨ (spatial fields) - *Coming soon*
- **live-session.js** - **YOUR CODE** - Live-codeable signal definitions

## Technical Details

- **Runtime**: Bun with `--hot` flag for hot-reload
- **Audio**: speaker.js (48kHz @ 32-bit float, stereo)
- **State Memory**: Float64Array (1024 slots, sub-sample precision)
- **Ring Buffer**: SharedArrayBuffer (32768 frames, ~680ms @ 48kHz)
- **Producer Loop**: `setImmediate` saturation for maximum throughput
- **Soft Clipping**: `Math.tanh()` on mixed output
- **Context Passing**: All signals receive `{t, dt, sampleRate}` for paradigm flexibility

## Why This Architecture?

### The Multi-Paradigm Vision

Different musical ideas require different levels of abstraction:
- **Rhythmos** (Earth) - Solid, predictable oscillators and envelopes
- **Kanon** (Fire) - Pure mathematical beauty
- **Atomos** (Air) - Generative, emergent textures
- **Physis** (Water) - Organic, physically-modeled instruments
- **Chora** (Aether) - Spatial acoustics and reverb

Aether lets you use all five together in a single composition.

### The Monochord Philosophy

Pythagoras discovered that harmony is mathematical using the monochord - a single vibrating string:
- Divide at 1:2 = Octave
- Divide at 2:3 = Perfect Fifth
- Divide at 3:4 = Perfect Fourth

In Aether:
- Your state array is the vibrating string
- Phase accumulation is continuous vibration
- Hot-reload adjusts tension while the string plays
- The monochord never stops. Neither does your music.

## Documentation

- **[AETHER_PARADIGMS.md](docs/AETHER_PARADIGMS.md)** - The Five Elements philosophy
- **[SURGERY_GUIDE.md](docs/SURGERY_GUIDE.md)** - Live coding workflow
- **[BEYOND-LISP.md](docs/BEYOND-LISP.md)** - How Aether transcends Lisp/Incudine
- **[PERFORMANCE_OPTIMIZATION.md](docs/PERFORMANCE_OPTIMIZATION.md)** - Optimization strategies
- **[AUDIO_BACKEND_ARCHITECTURE.md](docs/AUDIO_BACKEND_ARCHITECTURE.md)** - Backend design

## Roadmap

- [x] Core multi-paradigm architecture
- [x] Rhythmos paradigm (Earth 🌍)
- [x] Phase-continuous hot-swapping
- [x] 48kHz @ 32-bit float audio
- [x] Stereo support (STRIDE=2)
- [x] Zero-copy buffer optimization
- [x] Soft clipping with tanh()
- [x] Context-based signal updates
- [ ] Kanon paradigm (Fire 🔥)
- [ ] Atomos paradigm (Air 💨)
- [ ] Physis paradigm (Water 💧)
- [ ] Chora paradigm (Aether ✨)
- [ ] JACK FFI transport (PULL mode, <10ms latency)
- [ ] 3D oscilloscope integration (STRIDE=4: XYZW)
- [ ] Vim eval integration (select → send → eval)

## Credits

Inspired by:
- Incudine (Common Lisp DSP)
- SuperCollider (live coding pioneer)
- TidalCycles (pattern-based live coding)
- Max/MSP (dataflow paradigm)
- Pythagoras and the monochord

Built with:
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [speaker](https://github.com/TooTallNate/node-speaker) - Node.js audio output

## License

MIT

---

*"The monochord never stopped vibrating. It just evolved."* - Aether Engineering Principle
