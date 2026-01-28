# KANON - New FRP Architecture (2026)

## Architecture Overview

**Moved from:** genish.js peek/poke → **To:** Closure-based FRP with SharedArrayBuffer

### Core Layers

```
┌─────────────────────────────────────────┐
│  signals.js - Live Coding Interface     │  ← Edit this while running!
├─────────────────────────────────────────┤
│  kanon.js - Signal Registry (FRP)       │  ← Pure functional state transformers
├─────────────────────────────────────────┤
│  storage.js - Ring Buffer (The Well)    │  ← SharedArrayBuffer, survives hot-reload
├─────────────────────────────────────────┤
│  transport.js - Audio Sink              │  ← Speaker.js now, JACK FFI later
├─────────────────────────────────────────┤
│  engine.js - Producer Loop              │  ← Fills buffer, manages lifecycle
└─────────────────────────────────────────┘
```

### Key Features

- **Phase Continuity**: State persists in `globalThis.KANON_STATE` during hot-reload
- **Soft Clipping**: All signals auto-clipped with `Math.tanh()` for safety
- **Dimension Agnostic**: STRIDE=1 (mono) now, easy to upgrade to stereo/3D
- **Functional Purity**: Pure state transformers (state → nextState → sample)
- **Modular Transport**: Easy swap from speaker.js to JACK FFI later

## Quick Start

```bash
# Run with hot-reload
bun --hot index.js

# Edit signals.js while running for instant surgery!
```

## File Structure

- `index.js` - Entry point
- `engine.js` - Audio loop & lifecycle
- `storage.js` - Ring buffer (SharedArrayBuffer)
- `kanon.js` - Signal registry & mixing
- `transport.js` - Audio output (speaker.js)
- `signals.js` - **LIVE CODE HERE!** User-facing signal definitions
- `math-helpers.js` - Vector math utilities

### Old Files (Backed Up)

- `wave-dsp-old.js` - Old genish wrapper
- `signal-old.js` - Old genish-based API
- `genish.js` - No longer needed

## Example: Van der Pol Oscillator

```javascript
import { kanon } from './kanon.js';

const vanDerPolStep = (state, { mu, dt }) => {
  const [x, y] = state;
  const dx = y;
  const dy = mu * (1 - x * x) * y - x;
  return [x + dx * dt, y + dy * dt];
};

kanon('van-der-pol', (mem, idx) => {
  const params = { mu: 1.5, dt: 0.05 }; // Change these live!

  if (mem[idx] === 0) {
    mem[idx] = 0.1;
    mem[idx + 1] = 0.1;
  }

  return {
    update: () => {
      const current = [mem[idx], mem[idx + 1]];
      const [nextX, nextY] = vanDerPolStep(current, params);
      mem[idx] = nextX;
      mem[idx + 1] = nextY;
      return [nextX * 0.4]; // Mono output
    }
  };
});
```

## Migration from Old API

### Before (genish peek/poke):
```javascript
const phase = peek(globalThis.STATE, 0, { mode: 'samples' });
const newPhase = mod(add(phase, 440/44100), 1.0);
poke(globalThis.STATE, newPhase, 0);
return peek(globalThis.SINE_TABLE, newPhase);
```

### After (closure-based):
```javascript
let phase = state[idx];
phase = (phase + 440/44100) % 1.0;
state[idx] = phase;
return [Math.sin(phase * 2 * Math.PI)];
```

## Roadmap

- [x] Core FRP architecture with closures
- [x] Speaker.js transport (PUSH mode)
- [x] Mono audio (STRIDE=1)
- [x] Soft clipping with tanh()
- [x] Van der Pol example
- [ ] Port high-level sugar (osc, lfo, voices, withLfo)
- [ ] Stereo support (STRIDE=2)
- [ ] JACK FFI transport (PULL mode)
- [ ] 3D oscilloscope integration (STRIDE=4: XYZW)

## Philosophy

**State-driven, not time-driven:** Signals are recursive state transformers, not pure functions of time. This enables true "live surgery" - when you change parameters, the signal morphs continuously without phase jumps or clicks.

**Functional purity where it matters:** State transformers are pure functions, but we embrace stateful closures for performance. This is the 2026 way.

**Scientific-grade precision:** Float64Array for state, tanh() soft clipping, atomic ring buffer operations.
