# Composing with Signals: The Aither Philosophy of Rhythm

> The Clock is not a special object given to you by the engine. The Clock is
> a signal, created and composed by you. In Aither, rhythm is not a feature;
> it is an emergent property of the system.

## The Core Principle

In most live coding environments, rhythm is based on a central clock or a
timeline. You place notes on a grid, and the engine plays them.

Aither follows the modular synthesis approach:

1. **There is no master clock.** The only universal truth is `s.t`.
2. **A "clock" is just a low-frequency oscillator.**
3. **Rhythm emerges from composing signals through math.**

You don't ask for a clock; you build one.

---

## The Phasor: The Fundamental Rhythm Primitive

The most important signal for rhythm is the **phasor** — a ramp from 0 to 1
that repeats at a given frequency. It answers the question: *where am I in
the current beat?*

A phasor is the raw phase accumulator that lives inside every oscillator.
All other rhythm concepts — gates, envelopes, triggers, sequences — are
derived from the phasor through simple math.

```
phasor at 2 Hz (120 BPM):

1 |    /|    /|    /|    /|
  |   / |   / |   / |   / |
  |  /  |  /  |  /  |  /  |
  | /   | /   | /   | /   |
0 |/    |/    |/    |/    |
  |-----|-----|-----|-----|
  0    0.5   1.0   1.5   2.0 sec
```

> **Note:** `phasor(freq)` is planned but not yet implemented as a helper.
> For now, use the phase directly inside your signal function with `s.state`:

```javascript
play('click', s => {
  // Manual phasor: advance phase, wrap at 1.0
  const bps = 130 / 60;
  s.state[0] = (s.state[0] + bps / s.sr) % 1.0;
  const phase = s.state[0];

  // A click at the start of each beat
  return phase < 0.002 ? 0.8 : 0;
})
```

---

## From Phasor to Rhythm

Everything is derived from the phasor value with simple math:

### Gate (on/off pulse)

```javascript
// Gate: 1 for first 10% of beat, 0 otherwise
const gate = phase < 0.1 ? 1 : 0;
```

### Envelope (percussive decay)

```javascript
// Fast exponential decay from the start of each beat
const env = Math.exp(-phase * 30);
```

### Sequence (step through values)

```javascript
// Select from array based on position in cycle
const notes = [60, 63, 67, 70];
const note = notes[Math.floor(phase * notes.length)];
```

### Clock Division

```javascript
// Half-speed phasor (every 2 beats)
const halfPhase = (s.state[1] + (bps / 2) / s.sr) % 1.0;

// Double-speed phasor (eighth notes)
const doublePhase = (s.state[2] + (bps * 2) / s.sr) % 1.0;
```

---

## Building a Heartbeat Kick

This is Aither rhythm in practice — a kick drum built entirely from a
phasor, an envelope, and a sine oscillator with pitch sweep:

```javascript
play('kick', s => {
  // Phasor at 130 BPM
  const bps = 130 / 60;
  s.state[0] = (s.state[0] + bps / s.sr) % 1.0;
  const phase = s.state[0];

  // Sharp exponential envelope — the transient
  const env = Math.exp(-phase * 40);

  // Pitch sweep: starts at 260 Hz, decays to 60 Hz
  // This is what gives a kick its "thump"
  const freq = 60 + 200 * env;

  // Phase-continuous oscillator for the body
  s.state[1] = (s.state[1] + freq / s.sr) % 1.0;
  return Math.sin(s.state[1] * 2 * Math.PI) * env * 0.8;
})
```

No special kick drum helper. No sample playback. Just a phasor, an
envelope derived from it, and a sine wave whose frequency follows the
envelope. This is synthesis from first principles.

### Adding a Snare on Beats 2 and 4

```javascript
play('snare', s => {
  const bps = 130 / 60;

  // Half-speed phasor — triggers every 2 beats
  s.state[0] = (s.state[0] + (bps / 2) / s.sr) % 1.0;
  const phase = s.state[0];

  // Offset by half a cycle so it hits on beats 2 and 4
  const snarePhase = (phase + 0.5) % 1.0;

  // Snare envelope — shorter than kick
  const env = Math.exp(-snarePhase * 60);

  // Snare body (sine) + noise burst
  s.state[1] = (s.state[1] + 180 / s.sr) % 1.0;
  const body = Math.sin(s.state[1] * 2 * Math.PI) * 0.5;
  const crack = (Math.random() * 2 - 1) * 0.5;

  return (body + crack) * env * 0.6;
})
```

### Hi-Hats on Eighth Notes

```javascript
play('hats', s => {
  const bps = 130 / 60;

  // Double-speed phasor — eighth notes
  s.state[0] = (s.state[0] + (bps * 2) / s.sr) % 1.0;
  const phase = s.state[0];

  // Very short envelope
  const env = Math.exp(-phase * 80);

  // Filtered noise
  const noise = Math.random() * 2 - 1;
  // Simple highpass: subtract lowpassed version
  s.state[1] = s.state[1] * 0.8 + noise * 0.2;
  const hipass = noise - s.state[1];

  return hipass * env * 0.3;
})
```

---

## Two Patterns of Composition

Aither supports two natural patterns:

### Pattern 1: Separate Signals (Textures, Drones, Layers)

```javascript
play('pad', pipe(saw(110), signal => lowpass(signal, 400)))
play('shimmer', sin(s => 880 + tri(0.3)(s) * 20))
```

Each signal is independent. Oscillator helpers compose cleanly.

### Pattern 2: Inline (Percussive, Tightly Coupled)

```javascript
play('kick', s => {
  // Phase, envelope, pitch, oscillator — all interdependent
  const phase = ...;
  const env = f(phase);
  const freq = g(env);
  return oscillator(freq) * env;
})
```

When the envelope shapes the frequency which shapes the sound, everything
lives in one function using `s.state` for persistence. This is natural for
drums and percussive synthesis.

Both patterns coexist. Use the one that fits the sound.

---

## Groove and Swing

Real rhythm has human feel — some beats pushed forward, others laid back.
In Aither, you warp time itself:

```javascript
play('swung-hats', s => {
  const bps = 130 / 60;

  // Raw phase
  s.state[0] = (s.state[0] + (bps * 2) / s.sr) % 1.0;
  const phase = s.state[0];

  // Warp the phase: push odd beats late (swing feel)
  // sin(phase * PI) creates a subtle S-curve
  const swing = 0.1;
  const warped = phase + Math.sin(phase * Math.PI) * swing;

  const env = Math.exp(-warped * 80);
  const noise = Math.random() * 2 - 1;
  s.state[1] = s.state[1] * 0.8 + noise * 0.2;

  return (noise - s.state[1]) * env * 0.3;
})
```

You're not shifting note positions on a grid. You're **warping the
envelope's sense of time**.

---

## Planned Rhythm Helpers

> These helpers don't exist yet. They represent the vocabulary we're
> building toward. For now, use `s.state` and math as shown above.

```javascript
// phasor(freq) — 0→1 ramp, the fundamental rhythm primitive
const beat = phasor(s => 130/60);

// gate(freq, duty) — 0/1 pulse derived from phasor
const onOff = gate(s => 130/60, 0.1);

// decay(signal, rate) — exponential decay triggered by rising edges
const env = decay(beat, 40);

// seq(phasor, [...values]) — step through array values by phase position
const note = seq(beat, [60, 63, 67, 70]);

// euclidean(hits, steps, phasor) — euclidean rhythm pattern
const pattern = euclidean(3, 8, beat);
```

These are the building blocks of a rhythm language. Each is still a signal
— `f(s) → sample` — composable with everything else.

---

## Summary

1. **Start with a phasor**: `s.state[n] = (s.state[n] + freq/s.sr) % 1.0`
2. **Derive everything from phase**: gates, envelopes, sequences are just
   math on the 0→1 ramp
3. **Clock division is frequency division**: halve the frequency for half
   notes, double for eighth notes
4. **Use Pattern 1** (oscillator helpers) for sustained sounds
5. **Use Pattern 2** (inline with s.state) for percussive sounds where
   everything is interdependent
6. **Warp time for groove**: modulate the phase itself for swing and feel

In Aither, you don't program a drum pattern. You program the physics of a
drum being struck by a clock made of light.
