# Kanon Quick Start (Fire 🔥)

Get making pure functional music in 5 minutes.

## Your First Sound

Create or edit `live-session.js`:

```javascript
import { Kanon } from './src/arche/kanon/index.js';

// A pure function of time - 440Hz sine wave
const sine440 = t => Math.sin(2 * Math.PI * 440 * t);

Kanon.register('pure-tone', sine440);
```

Run:
```bash
bun --hot src/index.js
```

You should hear a pure 440Hz tone!

---

## Understanding f(t)

In Kanon, **everything is a function of time**:

```javascript
// t is time in seconds
const mySignal = t => {
  // Return a sample value between -1 and 1
  return Math.sin(2 * Math.PI * 440 * t);
};
```

That's it! `t` goes in, a sample comes out. Pure mathematics.

---

## Scaling Amplitude

Multiply by a gain value:

```javascript
const sine440 = t => Math.sin(2 * Math.PI * 440 * t);

// Quiet version (30% volume)
const quiet = t => sine440(t) * 0.3;

Kanon.register('quiet-tone', quiet);
```

Or use the `gain` helper:

```javascript
Kanon.register('quiet-tone',
  Kanon.gain(0.3, sine440)
);
```

---

## Mixing Sounds

Add functions together:

```javascript
const sine440 = t => Math.sin(2 * Math.PI * 440 * t);
const sine660 = t => Math.sin(2 * Math.PI * 660 * t);

// Mix two tones
const harmony = t => sine440(t) * 0.3 + sine660(t) * 0.3;

Kanon.register('harmony', harmony);
```

Or use the `mix` helper:

```javascript
Kanon.register('harmony',
  Kanon.mix(
    Kanon.gain(0.3, sine440),
    Kanon.gain(0.3, sine660)
  )
);
```

---

## Function Composition with Pipe

The `pipe` function chains transformations left-to-right:

```javascript
const sine440 = t => Math.sin(2 * Math.PI * 440 * t);

Kanon.register('processed',
  Kanon.pipe(
    sine440,           // Start with pure sine
    Kanon.gain(2.0),   // Amplify (will clip)
    Kanon.softClip,    // Soft clip with tanh
    Kanon.gain(0.3)    // Scale to safe level
  )
);
```

`pipe(f, g, h)` means: do `f`, then `g`, then `h`.

---

## Perfect Ratios (Pythagoras!)

Explore divine proportions:

```javascript
// Fundamental
const fundamental = t => Math.sin(2 * Math.PI * 220 * t);

// Perfect fifth (3:2 ratio)
const fifth = t => Math.sin(2 * Math.PI * 220 * 1.5 * t);

// Perfect fourth (4:3 ratio)
const fourth = t => Math.sin(2 * Math.PI * 220 * (4/3) * t);

// Golden ratio (φ)
const golden = t => Math.sin(2 * Math.PI * 220 * 1.618 * t);

Kanon.register('pythagorean',
  Kanon.pipe(
    Kanon.mix(
      Kanon.gain(0.4, fundamental),
      Kanon.gain(0.3, fifth),
      Kanon.gain(0.2, fourth),
      Kanon.gain(0.1, golden)
    )
  )
);
```

---

## Time-Based Control

Play sounds at specific times:

```javascript
// Play only during [1.0, 3.0) seconds
Kanon.register('timed',
  Kanon.during(1.0, 3.0, sine440)
);

// Sequence sounds
Kanon.register('sequence',
  Kanon.sequence(
    [sine440, 0.5],  // 440Hz for 0.5 sec
    [sine660, 0.5],  // 660Hz for 0.5 sec
    [sine880, 1.0]   // 880Hz for 1.0 sec
  )
);

// Loop forever
Kanon.register('loop',
  Kanon.loopForever(2.0, sine440)
);
```

---

## Envelopes

Shape the amplitude over time:

```javascript
const tone = t => Math.sin(2 * Math.PI * 440 * t);

// Exponential decay
const decaying = t => tone(t) * Math.exp(-t * 3);

Kanon.register('pluck', decaying);

// Or use envelope helpers
Kanon.register('pluck2', t => {
  const signal = Math.sin(2 * Math.PI * 440 * t);
  const envelope = Kanon.envExp(3, t);  // Decay rate 3
  return signal * envelope;
});
```

---

## Simple Delay (No Feedback)

Look backwards in time:

```javascript
const dry = t => Math.sin(2 * Math.PI * 440 * t);

// Echo 0.5 seconds later
const echo = t => {
  const direct = dry(t);
  const delayed = t >= 0.5 ? dry(t - 0.5) : 0;
  return (direct + delayed * 0.5) * 0.3;
};

Kanon.register('echo', echo);

// Or use the delay helper
Kanon.register('echo2',
  Kanon.pipe(
    dry,
    fn => t => fn(t) + Kanon.delay(0.5, fn)(t) * 0.5,
    Kanon.gain(0.3)
  )
);
```

---

## Amplitude Modulation (Tremolo)

Modulate one signal with another:

```javascript
const carrier = t => Math.sin(2 * Math.PI * 440 * t);
const modulator = t => Math.sin(2 * Math.PI * 5 * t);  // 5 Hz

// AM by hand
const tremolo = t => carrier(t) * modulator(t);

Kanon.register('tremolo', tremolo);

// Or use the am helper
Kanon.register('tremolo2',
  Kanon.am(modulator, carrier)
);
```

---

## Frequency Modulation (Vibrato Effect)

For simple cases, derive the phase analytically:

```javascript
// Vibrato: freq = 440 + 10·sin(2π·5·t)
// Phase integral: 440t - (10/(2π·5))·cos(2π·5·t)

const vibrato = t => {
  const baseFreq = 440;
  const vibratoRate = 5;
  const vibratoDepth = 10;

  const phase = baseFreq * t
    - (vibratoDepth / (2 * Math.PI * vibratoRate))
      * Math.cos(2 * Math.PI * vibratoRate * t);

  return Math.sin(2 * Math.PI * phase) * 0.3;
};

Kanon.register('vibrato', vibrato);
```

For complex FM, see [State vs Recursion](../../advanced/state-vs-recursion.md).

---

## Hot-Reload Note

When you change a Kanon function and save, it will **pop** on non-periodic parts. This is the trade-off for mathematical purity.

Example:
```javascript
// Change 440 → 550 and save
const sine440 = t => Math.sin(2 * Math.PI * 440 * t);
```

You'll hear a click because the phase jumps.

**Solution**: Use [Rhythmos](../rhythmos/quick-start.md) if you need smooth hot-reload. Or accept the pops as part of the mathematical exploration!

---

## Remove a Sound

```javascript
Kanon.remove('pure-tone');  // Remove by ID
```

Or clear all:
```javascript
import { clear } from './src/aether.js';
clear();  // Silence
```

---

## Next Steps

- **[Overview](overview.md)** - Understand the Kanon philosophy
- **[Pure Functions](pure-functions.md)** - Deep dive into functional programming
- **[Generative Music](generative/)** - Y-combinator, fractals, L-systems
- **[API Reference](api-reference.md)** - Complete function listing

---

## Quick Reference

```javascript
// Basic sine wave
t => Math.sin(2 * Math.PI * freq * t)

// Gain
Kanon.gain(amount, fn)

// Mix
Kanon.mix(fn1, fn2, fn3)

// Pipe
Kanon.pipe(fn1, fn2, fn3)

// Delay
Kanon.delay(delayTime, fn)

// During
Kanon.during(start, end, fn)

// Loop
Kanon.loopForever(duration, fn)

// Envelope
Kanon.envExp(rate, t)

// Modulation
Kanon.am(modulator, carrier)
```

---

Welcome to pure functional audio synthesis! 🔥

**Next**: [Overview](overview.md) | [Philosophy](../../PHILOSOPHY.md)
