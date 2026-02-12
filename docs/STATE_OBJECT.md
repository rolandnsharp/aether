# The Universe State Object (`s`)

> *"Everything you need, in one place."*

## Overview

The universe state object `s` is the single parameter passed to every signal function in Aether. It contains everything a signal needs to generate sound: time, position, sample rate, and persistent state memory.

```javascript
f(s) → sample
```

This unified interface is what allows all five paradigms to work together seamlessly.

---

## Complete Structure

```javascript
s = {
  // ============================================
  // TIME (Read-only, updated by engine)
  // ============================================
  t: 1.234,           // Absolute time in seconds since engine start
  dt: 0.0000208,      // Time delta for this sample (1/sampleRate)
  idx: 59328,         // Sample index in current buffer
  sr: 48000,          // Sample rate (samples per second)

  // ============================================
  // SPACE (Updated by engine or setPosition)
  // ============================================
  position: {
    x: 2.0,           // X position in 3D space (meters)
    y: 1.0,           // Y position in 3D space (meters)
    z: 0.0            // Z position in 3D space (meters)
  },

  // ============================================
  // SIGNAL IDENTITY (Read-only)
  // ============================================
  name: "my-signal",  // Unique name of this registered signal

  // ============================================
  // STATE MEMORY (Read/write, persistent)
  // ============================================
  state: Float64Array(128)  // Your signal's sandboxed state memory
}
```

---

## Time Properties

### `s.t` - Absolute Time

**Type:** `number` (seconds)
**Updated by:** Engine
**Persistence:** Continuous across hot-reloads

Absolute time in seconds since the engine started. Increases continuously at the sample rate.

**Uses:**
- Kanon paradigm (pure time functions)
- Time-based envelopes
- LFOs and modulation
- Time-varying parameters

**Example:**
```javascript
// Pure sine wave using s.t
register('kanon-sine', s => {
  return Math.sin(2 * Math.PI * 440 * s.t) * 0.3;
});
```

### `s.dt` - Time Delta

**Type:** `number` (seconds)
**Value:** `1 / s.sr`
**Updated by:** Engine (constant)

The time step between samples. Equal to the reciprocal of the sample rate.

**Uses:**
- Atomos paradigm (discrete time steps)
- Physis paradigm (physics integration)
- Time-based evolution

**Example:**
```javascript
// Physics integration using s.dt
register('spring', s => {
  const k = 100;  // Spring constant
  s.state[0] = s.state[0] || 0.1;  // Position
  s.state[1] = s.state[1] || 0;    // Velocity

  const force = -k * s.state[0] - 0.1 * s.state[1];
  s.state[1] += force * s.dt;  // Integrate velocity
  s.state[0] += s.state[1] * s.dt;  // Integrate position

  return s.state[0] * 0.5;
});
```

### `s.idx` - Sample Index

**Type:** `number` (integer)
**Updated by:** Engine
**Range:** `0` to `BUFFER_SIZE - 1` within each buffer

The current sample index within the audio buffer being rendered.

**Uses:**
- Buffer management
- Debugging
- Per-buffer operations (rare)

**Note:** Most signals don't need this. Use `s.t` for time-based operations.

### `s.sr` - Sample Rate

**Type:** `number` (Hz)
**Value:** `48000` (typically)
**Updated by:** Engine (constant)

The audio sample rate in samples per second.

**Uses:**
- Rhythmos paradigm (frequency → phase increment)
- Converting between frequency and samples
- Time calculations

**Example:**
```javascript
// Phase accumulation using s.sr
register('rhythmos-sine', s => {
  const freq = 440;
  s.state[0] = (s.state[0] + freq / s.sr) % 1.0;
  return Math.sin(s.state[0] * 2 * Math.PI) * 0.3;
});
```

---

## Space Properties

### `s.position` - Listener Position

**Type:** `{ x: number, y: number, z: number }`
**Units:** Meters
**Updated by:** `setPosition()` or engine
**Default:** `{ x: 0, y: 0, z: 0 }`

The listener's position in 3D space. Used by the Chora paradigm for spatial synthesis.

**Uses:**
- Chora paradigm (spatial wavefields)
- Distance attenuation
- Wave propagation
- Room modes
- Doppler effects

**Example:**
```javascript
// Spatial field with distance attenuation
register('spatial-wave', s => {
  const { x, y, z } = s.position;
  const distance = Math.sqrt(x*x + y*y + z*z);

  // 1/r amplitude falloff
  const amplitude = 1 / (distance + 1);

  return Math.sin(2 * Math.PI * 440 * s.t) * amplitude * 0.5;
});

// Move the listener
setPosition({ x: 2, y: 1, z: 0 });
```

---

## Identity Properties

### `s.name` - Signal Name

**Type:** `string`
**Updated by:** Engine (read-only)
**Value:** The name used in `register(name, fn)`

The unique identifier for this signal. Used internally for state management and helper memory allocation.

**Uses:**
- Debugging
- State key generation (internal)
- Helper state management (internal)

**Example:**
```javascript
register('my-signal', s => {
  console.log(s.name);  // "my-signal"
  return Math.sin(2 * Math.PI * 440 * s.t);
});
```

**Note:** You rarely need to access `s.name` directly. The engine uses it for helper state management.

---

## State Memory

### `s.state` - Persistent State Array

**Type:** `Float64Array`
**Size:** `128` slots (configurable)
**Persistence:** Survives hot-reloads
**Scope:** Sandboxed per signal

Your signal's private, persistent memory. Pre-allocated numeric storage for all stateful synthesis.

**Uses:**
- Oscillator phases
- Filter memory
- Delay buffers
- Physics state
- Chaos attractors
- Any numeric state

**Example:**
```javascript
// Using s.state for oscillator phase
register('osc', s => {
  s.state[0] = (s.state[0] + 440 / s.sr) % 1.0;
  return Math.sin(s.state[0] * 2 * Math.PI) * 0.3;
});

// Using multiple state slots
register('complex', s => {
  // State layout (use constants for clarity)
  const OSC_PHASE = 0;
  const FILTER_Z1 = 1;
  const ENV_LEVEL = 2;

  // Oscillator
  s.state[OSC_PHASE] = (s.state[OSC_PHASE] + 220 / s.sr) % 1.0;
  const osc = Math.sin(s.state[OSC_PHASE] * 2 * Math.PI);

  // Filter
  const alpha = 800 / s.sr;
  s.state[FILTER_Z1] = s.state[FILTER_Z1] + alpha * (osc - s.state[FILTER_Z1]);

  // Envelope
  s.state[ENV_LEVEL] = Math.max(0, s.state[ENV_LEVEL] - 0.001);

  return s.state[FILTER_Z1] * s.state[ENV_LEVEL];
});
```

**Best practice:** Use constants or enums to name your state slots:

```javascript
const STATE = {
  OSC1_PHASE: 0,
  OSC2_PHASE: 1,
  FILTER_Z1: 2,
  ENV_LEVEL: 3
};

register('synth', s => {
  s.state[STATE.OSC1_PHASE] = ...
  s.state[STATE.OSC2_PHASE] = ...
  // etc.
});
```

See [STATE_MANAGEMENT_BEST_PRACTICES.md](STATE_MANAGEMENT_BEST_PRACTICES.md) for more details.

---

## Paradigm Usage Patterns

### Kanon (Fire 🔥) - Pure Time

**Uses:** `s.t` only

```javascript
register('kanon', s => {
  return Math.sin(2 * Math.PI * 440 * s.t);
});
```

### Rhythmos (Earth 🌍) - Explicit State

**Uses:** `s.state`, `s.sr`

```javascript
register('rhythmos', s => {
  s.state[0] = (s.state[0] + 440 / s.sr) % 1.0;
  return Math.sin(s.state[0] * 2 * Math.PI);
});
```

### Atomos (Air 💨) - Discrete Steps

**Uses:** `s.state`, `s.dt`

```javascript
register('atomos', s => {
  s.state[0] = (s.state[0] || 0) + (Math.random() - 0.5) * s.dt * 100;
  s.state[0] = Math.max(-1, Math.min(1, s.state[0]));
  return s.state[0];
});
```

### Physis (Water 💧) - Physics

**Uses:** `s.state`, `s.dt`

```javascript
register('physis', s => {
  const k = 100;
  s.state[0] = s.state[0] || 0.1;
  s.state[1] = s.state[1] || 0;

  const force = -k * s.state[0] - 0.1 * s.state[1];
  s.state[1] += force * s.dt;
  s.state[0] += s.state[1] * s.dt;

  return s.state[0];
});
```

### Chora (Aether ✨) - Spatial

**Uses:** `s.position`, `s.t`

```javascript
register('chora', s => {
  const { x, y, z } = s.position;
  const distance = Math.sqrt(x*x + y*y + z*z);
  return Math.sin(2 * Math.PI * 440 * s.t) / (distance + 1);
});
```

---

## Performance Considerations

### Zero-GC Design

The `s` object is created once and reused. No allocations in the audio loop.

**Do:**
- Mutate `s.state` directly
- Use numeric values only
- Pre-allocate buffers outside the signal function

**Don't:**
- Create new objects inside signal functions
- Use arrays for state (use `s.state` instead)
- Allocate strings or other heap objects

### State Access Cost

- Reading `s.t`, `s.sr`, etc: **~1ns** (negligible)
- Reading `s.state[i]`: **~1ns** (negligible)
- Writing `s.state[i]`: **~1ns** (negligible)
- `Math.sin()`: **~30ns** (3x more expensive than state access)

**Conclusion:** Don't worry about state access overhead. Focus on algorithm efficiency.

---

## Further Reading

- [Helpers](HELPERS.md) - Using helpers with the state object
- [State Management Best Practices](STATE_MANAGEMENT_BEST_PRACTICES.md) - Managing complex state
- [Five Paradigms](AETHER_PARADIGMS.md) - How each paradigm uses `s`
- [Philosophy](PHILOSOPHY.md) - Why the unified interface matters

---

*"The state object is the universe. Your function observes it and produces sound."* — Aether
