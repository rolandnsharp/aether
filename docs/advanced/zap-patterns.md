# ⚡ Zap Patterns - The Five Elements Unified

> *One signature to rule them all: `s => value`*

This guide shows how to implement all five synthesis paradigms using Zap's unified signature, from pure time functions to physics simulations and spatial fields.

## Table of Contents

1. [Phase Continuity (Hot-Reload Without Pops)](#phase-continuity)
2. [Fire 🔥 - Kanon Patterns (Pure Time)](#fire--kanon-patterns)
3. [Earth 🌍 - Rhythmos Patterns (Stateful)](#earth--rhythmos-patterns)
4. [Air 💨 - Atomos Patterns (Discrete Events)](#air--atomos-patterns)
5. [Water 💧 - Physis Patterns (Physics)](#water--physis-patterns)
6. [Aether ✨ - Chora Patterns (Spatial)](#aether--chora-patterns)
7. [Advanced Techniques](#advanced-techniques)
8. [Performance Optimization](#performance-optimization)

---

## Phase Continuity

**The Problem:** Hot-reload can cause audible pops/clicks when phase jumps.

**The Solution:** Store phase in persistent state that survives hot-reload.

### ❌ Wrong: Phase jumps on reload

```javascript
// WRONG: Phase resets to 0 on every hot-reload
Zap.register('bad-sine', s => {
  const freq = 440;
  return Math.sin(2 * Math.PI * freq * s.t);
});
// Result: POP! Phase jumps when you edit the frequency
```

### ✅ Right: Phase preserved across reloads

```javascript
// CORRECT: Use persistent state for phase accumulation
Zap.register('good-sine', s => {
  const freq = 440;  // Change this live!

  // Initialize phase if not present
  if (s.phase === undefined) s.phase = 0;

  // Accumulate phase
  const phaseIncrement = freq / s.sr;
  s.phase = (s.phase + phaseIncrement) % 1.0;

  return Math.sin(s.phase * 2 * Math.PI);
});
// Result: Smooth! Phase continues from where it was
```

### Key Principle

**State survives hot-reload.** When you register a signal with Zap, its state object persists in `globalThis.ZAP_STATES`. This is how Rhythmos achieves pop-free editing, and Zap inherits this power.

```javascript
// The state object (s) persists across hot-reloads:
s = {
  t: 1.234,        // Updated by engine each sample
  idx: 59328,      // Updated by engine each sample
  dt: 0.0000208,   // Time delta
  sr: 48000,       // Sample rate
  position: {...}, // Spatial position

  // YOUR state persists too:
  phase: 0.847,    // Oscillator phases
  buffer: [...],   // Delay buffers
  filter_z1: 0.5,  // Filter memory
  // ... anything you add persists
}
```

### Composition with Manual State

For complex signals with multiple oscillators, manage state explicitly with unique keys:

```javascript
Zap.register('harmony', s => {
  // Initialize (runs once)
  if (!s.osc1) s.osc1 = 0;
  if (!s.osc2) s.osc2 = 0;
  if (!s.osc3) s.osc3 = 0;

  // Accumulate phases
  s.osc1 = (s.osc1 + 220 / s.sr) % 1.0;
  s.osc2 = (s.osc2 + 330 / s.sr) % 1.0;
  s.osc3 = (s.osc3 + 440 / s.sr) % 1.0;

  // Generate and mix
  return (
    Math.sin(s.osc1 * 2 * Math.PI) +
    Math.sin(s.osc2 * 2 * Math.PI) +
    Math.sin(s.osc3 * 2 * Math.PI)
  ) * 0.1;
});
```

This approach:
- ✅ Pop-free hot-reload
- ✅ No state bloat
- ✅ Full control
- ✅ Easy to reason about

---

## Fire 🔥 - Kanon Patterns

**Pure functions of time.** Beautiful, mathematical, but subject to phase discontinuities if not careful.

### Basic Pure Time Function

```javascript
// Simple sine - will pop on hot-reload if you change frequency
Zap.register('kanon-sine', s =>
  Math.sin(2 * Math.PI * 440 * s.t) * 0.3
);
```

### Amplitude Modulation (Tremolo)

```javascript
Zap.register('tremolo', s => {
  const carrier = Math.sin(2 * Math.PI * 440 * s.t);
  const lfo = Math.sin(2 * Math.PI * 4 * s.t);  // 4 Hz tremolo
  const depth = 0.5;

  return carrier * (1 - depth + depth * lfo) * 0.3;
});
```

### Frequency Modulation (FM)

```javascript
Zap.register('fm-bell', s => {
  const carrierFreq = 220;
  const modRatio = 1.618;  // Golden ratio
  const modIndex = 5;

  // Modulator
  const mod = Math.sin(2 * Math.PI * carrierFreq * modRatio * s.t);

  // Carrier (frequency modulated)
  const carrier = Math.sin(2 * Math.PI * carrierFreq * s.t + mod * modIndex);

  return carrier * Math.exp(-s.t * 2) * 0.5;  // With decay
});
```

### Additive Synthesis

```javascript
Zap.register('additive-organ', s => {
  const fundamental = 110;
  let sum = 0;

  // Add 8 harmonics with decreasing amplitude
  for (let harmonic = 1; harmonic <= 8; harmonic++) {
    sum += Math.sin(2 * Math.PI * fundamental * harmonic * s.t) / harmonic;
  }

  return sum * 0.15;
});
```

### Time-Warping Function

```javascript
Zap.register('time-warp', s => {
  // Warp time itself!
  const warpedTime = s.t + Math.sin(s.t * 2) * 0.1;
  return Math.sin(2 * Math.PI * 440 * warpedTime) * 0.3;
});
```

---

## Earth 🌍 - Rhythmos Patterns

**Stateful evolution.** Explicit phase accumulation for pop-free hot-reload.

### Phase-Accumulating Oscillator

```javascript
Zap.register('rhythmos-osc', s => {
  const freq = 330;

  // Initialize
  if (!s.osc_phase) s.osc_phase = 0;

  // Accumulate
  s.osc_phase = (s.osc_phase + freq / s.sr) % 1.0;

  // Generate
  return Math.sin(s.osc_phase * 2 * Math.PI) * 0.3;
});
```

### Multiple Oscillators with Independent Phases

```javascript
Zap.register('dual-osc', s => {
  // Initialize phases
  if (!s.osc1) s.osc1 = 0;
  if (!s.osc2) s.osc2 = 0;

  const freq1 = 220;
  const freq2 = 220 * 1.005;  // Slight detune

  // Accumulate
  s.osc1 = (s.osc1 + freq1 / s.sr) % 1.0;
  s.osc2 = (s.osc2 + freq2 / s.sr) % 1.0;

  // Mix
  const wave1 = (s.osc1 * 2 - 1);  // Sawtooth
  const wave2 = (s.osc2 * 2 - 1);

  return (wave1 + wave2) * 0.15;
});
```

### Envelope with State

```javascript
Zap.register('pluck-env', s => {
  // Initialize
  if (!s.env) {
    s.env = {
      level: 0,
      gate: 0,
      phase: 0
    };
  }

  // Retrigger every 2 seconds
  s.env.phase = (s.env.phase + 1 / s.sr) % 2.0;
  if (s.env.phase < 1 / s.sr) {
    s.env.gate = 1;
  }

  // Envelope logic
  if (s.env.gate === 1) {
    // Attack
    s.env.level += 0.01;
    if (s.env.level >= 1.0) {
      s.env.level = 1.0;
      s.env.gate = 0;
    }
  } else {
    // Decay
    s.env.level *= 0.9995;
  }

  // Apply to oscillator
  if (!s.osc) s.osc = 0;
  s.osc = (s.osc + 440 / s.sr) % 1.0;

  return Math.sin(s.osc * 2 * Math.PI) * s.env.level * 0.3;
});
```

### One-Pole Lowpass Filter

```javascript
Zap.register('filtered-saw', s => {
  // Initialize
  if (!s.phase) s.phase = 0;
  if (!s.z1) s.z1 = 0;  // Filter memory

  // Generate sawtooth
  s.phase = (s.phase + 220 / s.sr) % 1.0;
  const saw = s.phase * 2 - 1;

  // One-pole lowpass filter
  const cutoff = 800;  // Hz
  const alpha = cutoff / s.sr;
  s.z1 = s.z1 + alpha * (saw - s.z1);

  return s.z1 * 0.3;
});
```

---

## Air 💨 - Atomos Patterns

**Discrete events.** Granular, sample-based, event-driven.

### Karplus-Strong Plucked String

```javascript
Zap.register('pluck', s => {
  const freq = 220;
  const period = Math.floor(s.sr / freq);

  // Initialize buffer with noise
  if (!s.buffer) {
    s.buffer = Array.from({ length: period },
      () => Math.random() * 2 - 1
    );
  }

  // Read from buffer
  const idx = s.idx % period;
  const output = s.buffer[idx];

  // Karplus-Strong averaging
  const next = (idx + 1) % period;
  s.buffer[idx] = (s.buffer[idx] + s.buffer[next]) * 0.5 * 0.996;

  return output * 0.3;
});
```

### Wavetable Oscillator

```javascript
Zap.register('wavetable', s => {
  const freq = 440;

  // Initialize wavetable (only once)
  if (!s.table) {
    const tableSize = 2048;
    s.table = new Float32Array(tableSize);

    // Fill with a complex waveform
    for (let i = 0; i < tableSize; i++) {
      const phase = i / tableSize;
      // Add first 8 harmonics
      let sample = 0;
      for (let h = 1; h <= 8; h++) {
        sample += Math.sin(phase * h * 2 * Math.PI) / h;
      }
      s.table[i] = sample / 3;  // Normalize
    }
  }

  // Initialize phase
  if (!s.phase) s.phase = 0;

  // Accumulate phase
  s.phase = (s.phase + freq / s.sr) % 1.0;

  // Read from table with linear interpolation
  const tablePos = s.phase * s.table.length;
  const idx0 = Math.floor(tablePos);
  const idx1 = (idx0 + 1) % s.table.length;
  const frac = tablePos - idx0;

  const sample = s.table[idx0] * (1 - frac) + s.table[idx1] * frac;

  return sample * 0.3;
});
```

### Sample & Hold (Stepped Random)

```javascript
Zap.register('sample-hold', s => {
  const updateRate = 10;  // Hz
  const period = Math.floor(s.sr / updateRate);

  // Initialize
  if (!s.held) s.held = 0;

  // Update held value at discrete intervals
  if (s.idx % period === 0) {
    s.held = Math.random() * 2 - 1;
  }

  // Use held value as frequency modulation
  const baseFreq = 220;
  const modDepth = 50;
  const freq = baseFreq + s.held * modDepth;

  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + freq / s.sr) % 1.0;

  return Math.sin(s.phase * 2 * Math.PI) * 0.2;
});
```

### Granular Delay

```javascript
Zap.register('grain-delay', s => {
  const delayTime = 0.5;  // seconds
  const grainSize = 0.05;  // seconds

  // Initialize buffer
  if (!s.delayBuffer) {
    const bufferSize = Math.floor(s.sr * delayTime * 2);
    s.delayBuffer = new Float32Array(bufferSize);
    s.writeIdx = 0;
  }

  // Generate input signal
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 440 / s.sr) % 1.0;
  const input = Math.sin(s.phase * 2 * Math.PI);

  // Write to buffer
  s.delayBuffer[s.writeIdx] = input;
  s.writeIdx = (s.writeIdx + 1) % s.delayBuffer.length;

  // Read with grain envelope
  const delaySamples = Math.floor(delayTime * s.sr);
  const grainSamples = Math.floor(grainSize * s.sr);
  const readIdx = (s.writeIdx - delaySamples + s.delayBuffer.length) % s.delayBuffer.length;

  // Triangular grain window
  const grainPhase = (s.idx % grainSamples) / grainSamples;
  const window = 1 - Math.abs(grainPhase * 2 - 1);

  const delayed = s.delayBuffer[readIdx] * window;

  return (input + delayed * 0.5) * 0.2;
});
```

---

## Water 💧 - Physis Patterns

**Physics simulations.** Natural dynamics, non-linear systems, chaos.

### Van der Pol Oscillator

```javascript
Zap.register('van-der-pol', s => {
  const mu = 1.5;      // Non-linearity parameter
  const dt = 0.12;     // Time step (affects pitch)

  // Initialize state [x, y]
  if (!s.vdp) {
    s.vdp = { x: 0.1, y: 0.1 };
  }

  // Van der Pol equations
  const dx = s.vdp.y;
  const dy = mu * (1 - s.vdp.x * s.vdp.x) * s.vdp.y - s.vdp.x;

  // Euler integration
  s.vdp.x += dx * dt;
  s.vdp.y += dy * dt;

  return s.vdp.x * 0.4;
});
```

### Lorenz Attractor (Chaos)

```javascript
Zap.register('lorenz', s => {
  // Classic Lorenz parameters
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const dt = 0.005;

  // Initialize state [x, y, z]
  if (!s.lorenz) {
    s.lorenz = { x: 0.1, y: 0.1, z: 0.1 };
  }

  const { x, y, z } = s.lorenz;

  // Lorenz equations
  const dx = sigma * (y - x);
  const dy = x * (rho - z) - y;
  const dz = x * y - beta * z;

  // Euler integration
  s.lorenz.x += dx * dt;
  s.lorenz.y += dy * dt;
  s.lorenz.z += dz * dt;

  // Use X axis as audio (normalized)
  return s.lorenz.x * 0.05;
});
```

### Spring-Mass System

```javascript
Zap.register('spring', s => {
  const k = 100;        // Spring constant
  const m = 1;          // Mass
  const damping = 0.1;  // Damping coefficient

  // Initialize
  if (!s.spring) {
    s.spring = {
      position: 0,
      velocity: 10  // Initial impulse
    };
  }

  // Force = -k * x - damping * v
  const force = -k * s.spring.position - damping * s.spring.velocity;

  // a = F / m
  const acceleration = force / m;

  // Euler integration
  s.spring.velocity += acceleration * s.dt;
  s.spring.position += s.spring.velocity * s.dt;

  return s.spring.position * 0.1;
});
```

### Coupled Oscillators

```javascript
Zap.register('coupled', s => {
  const coupling = 0.1;

  // Initialize two oscillators
  if (!s.osc1) s.osc1 = { x: 1, v: 0 };
  if (!s.osc2) s.osc2 = { x: -1, v: 0 };

  // Forces with coupling
  const force1 = -s.osc1.x + coupling * (s.osc2.x - s.osc1.x);
  const force2 = -s.osc2.x + coupling * (s.osc1.x - s.osc2.x);

  // Update velocities and positions
  s.osc1.v += force1 * 0.01;
  s.osc1.x += s.osc1.v;
  s.osc1.v *= 0.999;  // Damping

  s.osc2.v += force2 * 0.01;
  s.osc2.x += s.osc2.v;
  s.osc2.v *= 0.999;

  return (s.osc1.x + s.osc2.x) * 0.15;
});
```

### Duffing Oscillator (Chaotic)

```javascript
Zap.register('duffing', s => {
  const alpha = 1;
  const beta = -1;
  const delta = 0.3;   // Damping
  const gamma = 0.3;   // Forcing amplitude
  const omega = 1.2;   // Forcing frequency
  const dt = 0.01;

  if (!s.duff) {
    s.duff = { x: 0.1, v: 0 };
  }

  // Forcing term
  const force = gamma * Math.cos(omega * s.t);

  // Duffing equation: x'' + delta*x' + alpha*x + beta*x^3 = force
  const acceleration = -delta * s.duff.v - alpha * s.duff.x
    - beta * s.duff.x * s.duff.x * s.duff.x + force;

  s.duff.v += acceleration * dt;
  s.duff.x += s.duff.v * dt;

  return s.duff.x * 0.3;
});
```

---

## Aether ✨ - Chora Patterns

**Spatial synthesis.** Fields, wave propagation, position-dependent sound.

### Distance-Based Attenuation

```javascript
Zap.register('spatial-sine', s => {
  const { x, y, z } = s.position;

  // Sound source at origin
  const distance = Math.sqrt(x*x + y*y + z*z);

  // 1/r falloff (inverse square law)
  const attenuation = 1 / (distance + 1);

  const signal = Math.sin(2 * Math.PI * 440 * s.t);

  return signal * attenuation * 0.5;
});

// Usage: engine.setPosition({ x: 2, y: 1, z: 0 });
```

### Wave Propagation (Delay from Distance)

```javascript
Zap.register('wave-prop', s => {
  const { x, y, z } = s.position;

  // Sound source position
  const sourceX = 0, sourceY = 0, sourceZ = 0;

  // Distance to source
  const dx = x - sourceX;
  const dy = y - sourceY;
  const dz = z - sourceZ;
  const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

  // Speed of sound (arbitrary units)
  const speedOfSound = 10;
  const travelTime = distance / speedOfSound;

  // Delayed time
  const delayedTime = s.t - travelTime;

  if (delayedTime < 0) return 0;  // Wave hasn't arrived yet

  // Signal with 1/r attenuation
  const freq = 220;
  const signal = Math.sin(2 * Math.PI * freq * delayedTime);
  const attenuation = 1 / (distance + 1);

  return signal * attenuation * 0.3;
});
```

### Doppler Effect

```javascript
Zap.register('doppler', s => {
  // Listener is moving
  const listenerVelocity = { x: 1, y: 0, z: 0 };

  // Source position (stationary)
  const sourcePos = { x: 0, y: 0, z: 0 };

  // Current listener position
  const { x, y, z } = s.position;

  // Vector from source to listener
  const dx = x - sourcePos.x;
  const dy = y - sourcePos.y;
  const dz = z - sourcePos.z;
  const distance = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.001;

  // Normalized direction
  const dirX = dx / distance;
  const dirY = dy / distance;
  const dirZ = dz / distance;

  // Relative velocity (component toward source)
  const relativeVelocity =
    listenerVelocity.x * dirX +
    listenerVelocity.y * dirY +
    listenerVelocity.z * dirZ;

  // Doppler shift (simplified)
  const speedOfSound = 343;  // m/s
  const dopplerFactor = 1 / (1 + relativeVelocity / speedOfSound);

  const baseFreq = 440;
  const shiftedFreq = baseFreq * dopplerFactor;

  // Initialize phase
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + shiftedFreq / s.sr) % 1.0;

  const attenuation = 1 / (distance + 1);

  return Math.sin(s.phase * 2 * Math.PI) * attenuation * 0.3;
});
```

### Standing Wave (Modal Resonance)

```javascript
Zap.register('standing-wave', s => {
  const { x, y, z } = s.position;

  // Room dimensions
  const Lx = 10, Ly = 8, Lz = 3;

  // Mode numbers
  const nx = 1, ny = 1, nz = 0;

  // Spatial pattern
  const spatial =
    Math.sin(nx * Math.PI * x / Lx) *
    Math.sin(ny * Math.PI * y / Ly) *
    (nz === 0 ? 1 : Math.sin(nz * Math.PI * z / Lz));

  // Modal frequency
  const c = 343;  // Speed of sound
  const freq = (c / 2) * Math.sqrt(
    (nx/Lx)*(nx/Lx) + (ny/Ly)*(ny/Ly) + (nz/Lz)*(nz/Lz)
  );

  // Time-varying amplitude
  const temporal = Math.sin(2 * Math.PI * freq * s.t);

  return spatial * temporal * 0.2;
});
```

### Field Interference

```javascript
Zap.register('interference', s => {
  const { x, y, z } = s.position;

  // Two sound sources
  const source1 = { x: -2, y: 0, z: 0 };
  const source2 = { x: 2, y: 0, z: 0 };

  // Distance to each source
  const d1 = Math.sqrt(
    (x - source1.x)**2 + (y - source1.y)**2 + (z - source1.z)**2
  );
  const d2 = Math.sqrt(
    (x - source2.x)**2 + (y - source2.y)**2 + (z - source2.z)**2
  );

  const freq = 440;
  const speedOfSound = 10;

  // Wave from each source
  const wave1 = Math.sin(2 * Math.PI * (freq * s.t - d1 / speedOfSound)) / (d1 + 1);
  const wave2 = Math.sin(2 * Math.PI * (freq * s.t - d2 / speedOfSound)) / (d2 + 1);

  // Interference pattern
  return (wave1 + wave2) * 0.3;
});
```

---

## Advanced Techniques

### 1. Feedback Loops

```javascript
Zap.register('feedback', s => {
  // Initialize feedback buffer
  if (!s.feedbackBuffer) {
    s.feedbackBuffer = new Float32Array(4800);  // 100ms at 48kHz
    s.feedbackIdx = 0;
  }

  // Input signal
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 110 / s.sr) % 1.0;
  const input = Math.sin(s.phase * 2 * Math.PI) * 0.1;

  // Read from buffer
  const delayed = s.feedbackBuffer[s.feedbackIdx];

  // Mix input with feedback
  const mixed = input + delayed * 0.7;

  // Soft clip to prevent explosion
  const clipped = Math.tanh(mixed);

  // Write to buffer
  s.feedbackBuffer[s.feedbackIdx] = clipped;
  s.feedbackIdx = (s.feedbackIdx + 1) % s.feedbackBuffer.length;

  return clipped * 0.5;
});
```

### 2. Spectral Processing

```javascript
Zap.register('spectral', s => {
  // This is a conceptual example - real FFT would be more complex

  if (!s.fftBuffer) {
    s.fftBuffer = new Float32Array(1024);
    s.fftIdx = 0;
  }

  // Generate signal
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 220 / s.sr) % 1.0;
  const input = Math.sin(s.phase * 2 * Math.PI);

  // Fill buffer
  s.fftBuffer[s.fftIdx] = input;
  s.fftIdx = (s.fftIdx + 1) % s.fftBuffer.length;

  // Simple spectral effect: frequency shift by convolution
  // (This is a simplified example)
  let output = 0;
  for (let i = 0; i < 16; i++) {
    const idx = (s.fftIdx - i + s.fftBuffer.length) % s.fftBuffer.length;
    const coef = Math.cos(2 * Math.PI * i / 16);
    output += s.fftBuffer[idx] * coef;
  }

  return output * 0.1;
});
```

### 3. Waveshaping (Non-linear Distortion)

```javascript
Zap.register('waveshape', s => {
  // Generate clean signal
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 110 / s.sr) % 1.0;
  const clean = Math.sin(s.phase * 2 * Math.PI);

  // Various waveshapers
  const drive = 3;
  const input = clean * drive;

  // Soft clipping (tanh)
  const softClip = Math.tanh(input);

  // Hard clipping
  const hardClip = Math.max(-1, Math.min(1, input));

  // Cubic waveshaper
  const cubic = input - (input * input * input) / 3;

  // Chebyshev polynomial (adds harmonics)
  const cheby = input * (3 - input * input) / 2;

  // Choose one
  return softClip * 0.3;
});
```

### 4. Cross-Modulation Matrix

```javascript
Zap.register('mod-matrix', s => {
  // Initialize 3 oscillators
  if (!s.osc1) s.osc1 = 0;
  if (!s.osc2) s.osc2 = 0;
  if (!s.osc3) s.osc3 = 0;

  const f1 = 110;
  const f2 = 220;
  const f3 = 330;

  // Read current values
  const v1 = Math.sin(s.osc1 * 2 * Math.PI);
  const v2 = Math.sin(s.osc2 * 2 * Math.PI);
  const v3 = Math.sin(s.osc3 * 2 * Math.PI);

  // Cross-modulation matrix
  const mod12 = 0.1;  // Osc 2 modulates Osc 1
  const mod23 = 0.15; // Osc 3 modulates Osc 2
  const mod31 = 0.05; // Osc 1 modulates Osc 3

  // Update phases with cross-modulation
  s.osc1 = (s.osc1 + (f1 + v2 * mod12 * 50) / s.sr) % 1.0;
  s.osc2 = (s.osc2 + (f2 + v3 * mod23 * 50) / s.sr) % 1.0;
  s.osc3 = (s.osc3 + (f3 + v1 * mod31 * 50) / s.sr) % 1.0;

  return (v1 + v2 + v3) * 0.1;
});
```

### 5. State-Variable Filter (Multi-mode)

```javascript
Zap.register('svf', s => {
  const freq = 1000;  // Cutoff frequency
  const Q = 2;        // Resonance

  // Initialize filter state
  if (!s.svf) {
    s.svf = { low: 0, band: 0, high: 0 };
  }

  // Generate input
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 110 / s.sr) % 1.0;
  const input = s.phase * 2 - 1;  // Sawtooth

  // SVF equations
  const f = 2 * Math.sin(Math.PI * freq / s.sr);
  const damp = 1 / Q;

  s.svf.high = input - s.svf.low - damp * s.svf.band;
  s.svf.band = s.svf.band + f * s.svf.high;
  s.svf.low = s.svf.low + f * s.svf.band;

  // Choose output: low, band, high, or notch
  const lowpass = s.svf.low;
  const bandpass = s.svf.band;
  const highpass = s.svf.high;
  const notch = input - s.svf.band;

  return lowpass * 0.3;  // Use lowpass
});
```

### 6. Fractal Noise (1/f)

```javascript
Zap.register('pink-noise', s => {
  // Initialize octave states
  if (!s.octaves) {
    s.octaves = Array(10).fill(0);
  }

  let sum = 0;

  // Update each octave at different rates
  for (let i = 0; i < s.octaves.length; i++) {
    const rate = Math.pow(2, i);

    if (s.idx % rate === 0) {
      s.octaves[i] = Math.random() * 2 - 1;
    }

    sum += s.octaves[i] / (i + 1);  // 1/f rolloff
  }

  return sum * 0.1;
});
```

### 7. Resonator Bank (Formant Synthesis)

```javascript
Zap.register('formants', s => {
  // Formant frequencies (vowel "ah")
  const formants = [
    { freq: 730, bw: 60 },   // F1
    { freq: 1090, bw: 70 },  // F2
    { freq: 2440, bw: 110 }  // F3
  ];

  // Initialize filters
  if (!s.filters) {
    s.filters = formants.map(() => ({ z1: 0, z2: 0 }));
  }

  // Generate excitation (pulse train for voiced)
  if (!s.pulse) s.pulse = 0;
  s.pulse = (s.pulse + 120 / s.sr) % 1.0;
  const excitation = s.pulse < 0.01 ? 1 : 0;

  let output = 0;

  // Run through each formant filter
  for (let i = 0; i < formants.length; i++) {
    const { freq, bw } = formants[i];
    const filter = s.filters[i];

    // Bandpass coefficients (simplified)
    const omega = 2 * Math.PI * freq / s.sr;
    const alpha = 2 * Math.PI * bw / s.sr;

    const cos_omega = Math.cos(omega);
    const r = Math.exp(-alpha);

    // Bandpass difference equation
    const y = excitation - 2 * r * cos_omega * filter.z1 + r * r * filter.z2;

    filter.z2 = filter.z1;
    filter.z1 = y;

    output += y;
  }

  return output * 0.15;
});
```

---

## Performance Optimization

### 1. Pre-compute Constants

```javascript
// ❌ SLOW: Recomputes every sample
Zap.register('slow', s => {
  const omega = 2 * Math.PI * 440;  // Computed 48000 times/sec!
  return Math.sin(omega * s.t) * 0.3;
});

// ✅ FAST: Compute once outside
const omega = 2 * Math.PI * 440;
Zap.register('fast', s => {
  return Math.sin(omega * s.t) * 0.3;
});
```

### 2. Use Phase Accumulation for Efficiency

```javascript
// ❌ SLOWER: sin() with large argument every sample
const freq = 440;
Zap.register('slower', s => {
  return Math.sin(2 * Math.PI * freq * s.t) * 0.3;
});

// ✅ FASTER: Phase accumulation keeps argument small
Zap.register('faster', s => {
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + freq / s.sr) % 1.0;
  return Math.sin(s.phase * 2 * Math.PI) * 0.3;
});
```

### 3. Typed Arrays for Buffers

```javascript
// ✅ Use typed arrays for large buffers
if (!s.buffer) {
  s.buffer = new Float32Array(4800);  // NOT Array()
}
```

### 4. Minimize Allocations

```javascript
// ❌ Allocates array every sample!
Zap.register('allocation-hell', s => {
  const array = [s.t, s.dt, s.idx];  // 48000 arrays/sec!
  return Math.sin(2 * Math.PI * 440 * array[0]);
});

// ✅ No allocations
Zap.register('allocation-free', s => {
  return Math.sin(2 * Math.PI * 440 * s.t);
});
```

### 5. Wavetable for Complex Waveforms

```javascript
// ❌ SLOW: Compute 8 sin() calls per sample
Zap.register('computed', s => {
  let sum = 0;
  for (let h = 1; h <= 8; h++) {
    sum += Math.sin(2 * Math.PI * 440 * h * s.t) / h;
  }
  return sum * 0.1;
});

// ✅ FAST: Pre-compute in wavetable, read per sample
const table = new Float32Array(2048);
for (let i = 0; i < 2048; i++) {
  const phase = i / 2048;
  let sum = 0;
  for (let h = 1; h <= 8; h++) {
    sum += Math.sin(phase * h * 2 * Math.PI) / h;
  }
  table[i] = sum / 3;
}

Zap.register('wavetable', s => {
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 440 / s.sr) % 1.0;
  const idx = Math.floor(s.phase * 2048);
  return table[idx] * 0.1;
});
```

---

## Composition Patterns

### Using Zap's Composition Helpers

```javascript
// Mix three oscillators
const harmony = Zap.mix(
  Zap.sine(220),
  Zap.sine(330),
  Zap.sine(440)
);

Zap.register('harmony', harmony);
```

```javascript
// Pipe effects
const processed = Zap.pipe(
  Zap.sine(110),
  s => Zap.lowpass(s => s, 800)(s),
  s => Zap.softClip(s => s, 2)(s)
);

Zap.register('processed', processed);
```

```javascript
// Gain control
const loud = Zap.gain(Zap.sine(440), 0.5);
Zap.register('loud-sine', loud);
```

---

## Philosophical Notes

### Why One Signature Works

The `s => value` signature is universal because **s contains everything**:

- **Time** (`s.t`) → Kanon (pure functions)
- **State** (mutate `s.*`) → Rhythmos (stateful)
- **Sample index** (`s.idx`) → Atomos (discrete)
- **Delta time** (`s.dt`) → Physis (physics integration)
- **Position** (`s.position`) → Chora/Aether (spatial)

You don't need different paradigms. You need **one language** that speaks all dialects.

### The Pragmatic FP Approach

Zap looks functional: `s => value`

But it's secretly stateful: mutate `s` as needed.

This is **pragmatic functional programming**:
- Pure when you want it (just read from `s`)
- Stateful when you need it (mutate `s`)
- Best of both worlds

### Live Coding Power

```javascript
// Start with this
Zap.register('evolve', s => Math.sin(2 * Math.PI * 440 * s.t) * 0.3);

// Instantly change to this (smooth!)
Zap.register('evolve', s => Math.sin(2 * Math.PI * 220 * s.t) * 0.3);

// Then to this (phase-continuous!)
Zap.register('evolve', s => {
  if (!s.p) s.p = 0;
  s.p = (s.p + 220 / s.sr) % 1.0;
  return Math.sin(s.p * 2 * Math.PI) * 0.3;
});

// All transitions are smooth because state persists!
```

---

## Further Reading

- [Zap README](../../src/arche/zap/README.md) - API reference
- [PARADIGM-DESIGN.md](../../PARADIGM-DESIGN.md) - Design philosophy
- [Kanon Performance Optimization](./kanon-performance-optimization.md)
- [Audio-Visual Synthesis](./audio-visual-synthesis.md)

---

**⚡ Master these patterns, and you master the five elements. ⚡**
