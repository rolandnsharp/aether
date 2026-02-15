# DSP Reference

Every function in Aither's DSP library is a signal or a signal transformer.
A signal is `f(s) → sample`. A transformer takes a signal and returns a new
signal. They compose freely with `pipe`, `mix`, and plain JavaScript.

---

## Oscillators

Signal sources. Each returns a mono signal function with a phase-continuous
accumulator that persists across hot-reloads. Frequency accepts a number or
a function of `s` for modulation.

### `sin(freq)`
Sine wave. The purest tone — no harmonics.
```javascript
play('pure', sin(440))
play('vibrato', sin(s => 440 + Math.sin(s.t * 5) * 10))
```

### `saw(freq)`
Sawtooth wave. All harmonics, bright and buzzy. Good for basses and leads.
```javascript
play('bass', pipe(saw(110), signal => lowpass(signal, 400)))
```

### `tri(freq)`
Triangle wave. Odd harmonics only, softer than saw. Mellow lead tone.
```javascript
play('soft', tri(330))
```

### `square(freq)`
Square wave. Odd harmonics, hollow sound. Classic chiptune tone.
```javascript
play('chip', square(440))
```

### `pulse(freq, width)`
Pulse wave with variable duty cycle. Width 0.5 = square, lower = nasal.
Width accepts a number or function of `s`.
```javascript
play('pwm', pulse(220, s => 0.1 + Math.sin(s.t * 0.5) * 0.4))
```

### `phasor(freq)`
A 0→1 ramp that repeats at the given frequency. The fundamental rhythm
primitive — gates, envelopes, and sequences are all derived from it.
See [Rhythm Philosophy](RHYTHM_PHILOSOPHY.md).
```javascript
const beat = phasor(130/60);   // 130 BPM quarter notes
const fast = phasor(130/30);   // eighth notes (double freq)
const slow = phasor(130/120);  // half notes (half freq)
```

### `noise()`
White noise. Stateless — no phase accumulator needed.
```javascript
play('static', noise())
play('hiss', pipe(noise(), signal => lowpass(signal, 2000)))
```

---

## Composition

### `pipe(signal, ...transforms)`
Chain a signal through a series of transforms left to right.
```javascript
play('chain', pipe(
  saw(110),
  signal => lowpass(signal, 600),
  signal => feedback(signal, 1.0, 0.3, 0.5)
))
```

### `mix(...signals)`
Sum multiple signals together. Each signal controls its own gain.
`Math.tanh()` at the output handles clipping.
```javascript
play('chord', mix(
  s => sin(261)(s) * 0.2,
  s => sin(329)(s) * 0.2,
  s => sin(392)(s) * 0.2
))
```

---

## Helpers

### `share(signal)`
Evaluate a signal once per sample and share the result.

In functional reactive programming (Haskell's `reactive` library, Elm,
Sodium), signals are functions — and passing a function to two consumers
means it runs twice. If the signal is stateful (like a phasor with a phase
accumulator), running it twice advances the state twice. The signal plays at
double speed.

Haskell's `share` combinator solves this by evaluating a `Behavior` or
`Event` once and letting multiple observers see the same value. Aither's
`share` does the same thing: it caches the signal's output for the current
sample so that every call within the same sample returns the same value.

Use `share` whenever a signal appears in more than one place:

```javascript
const beat = phasor(130/60);
const envelope = share(decay(beat, 40));

// envelope(s) is called twice here — once for frequency, once for
// amplitude. Without share, the phasor would advance twice per sample.
const kick = sin(s => 60 + envelope(s) * 200);
play('kick', s => kick(s) * envelope(s) * 0.8)
```

Without `share`, the kick would play at double BPM because `decay(beat, 40)`
would call `beat(s)` twice — once from `sin`'s frequency function and once
from the `play` callback — advancing the phasor twice per sample.

**When you don't need `share`:** If a stateful signal is only called once
per sample — meaning it appears in only one place in your `play` callback
and no other signal's frequency function references it — you don't need
`share`. The signal only evaluates once, so there's nothing to share.

```javascript
// No share needed — hatEnv is only called once in the play callback.
// hatBeat is only called once inside hatEnv. One consumer each.
const hatBeat = phasor(130/30);
const hatEnv = decay(hatBeat, 80);
const hiss = pipe(noise(), signal => highpass(signal, 6000));
play('hats', s => hiss(s) * hatEnv(s) * 0.3)

// Share needed — envelope is called twice: once inside sin's frequency
// function, once in the play callback for amplitude.
const beat = phasor(130/60);
const envelope = share(decay(beat, 40));
const kick = sin(s => 60 + envelope(s) * 200);
play('kick', s => kick(s) * envelope(s) * 0.8)
```

**Rule of thumb:** count how many times a stateful signal's name appears
inside `play(...)` and inside other signals' frequency functions. If it's
more than once, wrap it in `share`.

### `gain(signal, amount)`
Multiply a signal by a gain factor. Amount accepts a number or function of `s`.
Works on both mono and multichannel signals.
```javascript
play('quiet', gain(sin(440), 0.1))
play('swell', gain(sin(440), s => Math.sin(s.t * 0.5) * 0.5))
```

### `decay(signal, rate)`
Exponential decay envelope. Takes a 0→1 signal (typically a phasor) and
returns a 1→0 exponential curve. Rate controls how fast — higher is tighter.
```javascript
const beat = phasor(130/60);
decay(beat, 20)    // boomy, slow decay
decay(beat, 40)    // standard kick
decay(beat, 80)    // tight click
decay(beat, s => 20 + Math.sin(s.t * 0.1) * 15)  // evolving tightness
```

### `pan(signal, position)`
Place a mono signal in the stereo field. Position is -1 (left) to +1 (right).
Returns a stereo `[left, right]` array.
```javascript
play('left', pan(sin(440), -0.7))
play('autopan', pan(sin(440), s => Math.sin(s.t * 0.5)))
```

---

## Effects

Stateful signal processors. Stride-agnostic — they automatically handle
mono and multichannel signals via `expand()`.

### `lowpass(signal, cutoff)`
One-pole lowpass filter. Cutoff in Hz, accepts number or function of `s`.
```javascript
pipe(saw(110), signal => lowpass(signal, 400))
pipe(saw(110), signal => lowpass(signal, s => 200 + Math.sin(s.t) * 150))
```

### `tremolo(signal, rate, depth)`
Amplitude modulation via LFO. Rate in Hz, depth 0→1.
```javascript
pipe(sin(440), signal => tremolo(signal, 4, 0.5))
```

### `delay(signal, maxTime, time)`
Delay line. `maxTime` sets the buffer size (fixed at creation), `time` is
the current delay in seconds (can be modulated).
```javascript
pipe(sin(440), signal => delay(signal, 1.0, 0.25))
```

### `feedback(signal, maxTime, time, amount)`
Delay with feedback — output feeds back into the delay buffer creating
regenerating echoes. Amount 0→1 (above 0.9 gets dangerous).
```javascript
pipe(sin(440), signal => feedback(signal, 2.0, 0.375, 0.6))
```

### `reverb(signal, time, damping, mix)`
Schroeder reverb — 4 parallel comb filters with damping fed into 2 series
allpass filters for echo density. Sounds like a room.

- `time` — RT60 decay time in seconds. How long the tail rings.
- `damping` — high-frequency absorption, 0 (bright) to 1 (dark).
- `mix` — dry/wet crossfade, 0 (all dry) to 1 (all wet).

All parameters accept a number or function of `s`.

```javascript
// Small bright room
pipe(sin(440), signal => reverb(signal, 0.8, 0.2, 0.3))

// Large dark hall
pipe(tri(220), signal => reverb(signal, 3.0, 0.7, 0.5))

// Evolving space
pipe(saw(110),
  signal => lowpass(signal, 600),
  signal => reverb(signal, 2.0, s => 0.3 + Math.sin(s.t * 0.1) * 0.2, 0.4)
)
```

---

## FM Synthesis

There is no `fm()` helper. FM synthesis is just composition — one oscillator
modulating another's frequency:

```javascript
const mod = sin(280);
const carrier = sin(s => 440 + mod(s) * 200);
play('bell', carrier)
```

Any waveform can be a modulator. The depth (200) is in Hz — how far the
carrier frequency swings. See [Signals vs Events](SIGNALS_VS_EVENTS.md)
for more FM examples.
