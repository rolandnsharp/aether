# Kanon Paradigm (Fire 🔥)

> *"All is Number."* — Pythagoras

## Philosophy

**Kanon** (κανών) - Ancient Greek for "rule" or "measuring rod" - was the monochord instrument Pythagoras used to discover that harmony is mathematical ratio.

In Aether, **Kanon** represents the **pure functional paradigm**: sound as a function of time `f(t)`.

### The Pythagorean View

Kanon treats sound as **eternal geometry** that exists timelessly. When you write `f(t)`, you're not simulating a process—you're **observing a crystalline structure** that exists in its entirety.

- Sound waves are **timeless blueprints**
- Harmony is **mathematical ratio** (3:2, 4:3, φ)
- The universe is a **pre-existing block of perfection**
- The Music of the Spheres doesn't *happen*—it simply **is**

---

## Signature

```javascript
f(t) → sample
```

Where:
- `t` = absolute time (seconds)
- `sample` = audio value at that moment

**Pure function**: No state, no history, just pure mathematics.

---

## Use Cases

✅ **Perfect for:**
- Mathematical demonstrations
- Teaching harmonic relationships
- Modulation sources for other paradigms
- Compositions with absolute time coordinates
- Exploring divine proportions and ratios

⚠️ **Not ideal for:**
- Smooth hot-reload (will pop on non-periodic changes)
- Feedback or IIR filters (need recursion/memoization)
- State-dependent synthesis

---

## Quick Example

```javascript
import { Kanon } from './src/arche/kanon/index.js';

// Pure functions of time
const sine440 = t => Math.sin(2 * Math.PI * 440 * t);
const sine660 = t => Math.sin(2 * Math.PI * 660 * t);

// Perfect fifth harmony (3:2 ratio)
Kanon.register('harmony',
  Kanon.pipe(
    Kanon.mix(
      Kanon.gain(0.5, sine440),
      Kanon.gain(0.5, sine660)
    ),
    Kanon.softClip
  )
);
```

---

## Core Principles

### 1. Purity

Every Kanon function is **referentially transparent**:
```javascript
f(5.0) === f(5.0)  // Always!
```

No hidden state, no side effects. Just pure math.

### 2. Timelessness

The entire signal exists **eternally**. You can evaluate any point:
```javascript
const signal = t => Math.sin(2 * Math.PI * 440 * t);

signal(0.0);    // Beginning
signal(5.0);    // 5 seconds in
signal(100.0);  // 100 seconds in

// All exist simultaneously in the eternal Now
```

### 3. Composability

Functions compose beautifully:
```javascript
const fundamental = t => Math.sin(2 * Math.PI * 220 * t);
const fifth = t => Math.sin(2 * Math.PI * 330 * t);  // 3:2 ratio

const harmony = t => fundamental(t) + fifth(t);
```

---

## Trade-offs

### ✅ Advantages

- **Mathematical purity**: Elegant, beautiful, educational
- **Random access**: Can evaluate any time point independently
- **Composability**: Functions combine naturally
- **Reproducible**: Same input always gives same output
- **Platform-independent**: Pure functions work anywhere

### ⚠️ Limitations

- **Hot-reload pops**: Non-periodic functions will have discontinuities
- **No phase memory**: Can't do smooth frequency changes without analysis
- **Performance**: Naive recursion can be expensive (use memoization)

---

## When to Use Kanon vs Rhythmos

Use **Kanon** when:
- Exploring mathematical relationships
- Teaching concepts
- Creating modulation sources
- You don't care about hot-reload discontinuities
- Purity matters more than smoothness

Use **Rhythmos** when:
- Performing live with hot-reload
- Need smooth parameter changes
- Building production instruments
- Phase continuity is essential

**Or use both!** Kanon can modulate Rhythmos signals.

---

## Advanced Topics

### Recursive Functions

Kanon supports recursion + memoization for complex patterns:

```javascript
// Feedback using memoization
export const feedback = curry((delayTime, feedbackAmt, fn, sampleRate = 48000) => {
  const cache = new Map();

  const output = t => {
    const key = Math.round(t * sampleRate);
    if (cache.has(key)) return cache.get(key);

    if (t < delayTime) {
      return fn(t);
    }

    const dry = fn(t);
    const wet = output(t - delayTime) * feedbackAmt;
    return dry + wet;
  };

  return output;
});
```

### Y-Combinator

Anonymous recursion without self-reference:

```javascript
export const Y = makeRecursive => {
  const wrapper = recursiveFunc => makeRecursive(
    (...args) => recursiveFunc(recursiveFunc)(...args)
  );
  return wrapper(wrapper);
};

// Use for generative patterns, fractals, L-systems
```

See [Y-Combinator Music](generative/y-combinator.md) for deep dive.

### Time-Based Composition

```javascript
// Play function during time interval
export const during = curry((start, end, fn) => t => {
  if (t >= start && t < end) {
    return fn(t - start);
  }
  return 0;
});

// Sequence functions
export const sequence = (...pairs) => t => {
  let accumulatedTime = 0;
  for (const [fn, duration] of pairs) {
    if (t >= accumulatedTime && t < accumulatedTime + duration) {
      return fn(t - accumulatedTime);
    }
    accumulatedTime += duration;
  }
  return 0;
});
```

---

## API Reference

See [Kanon API Reference](api-reference.md) for complete documentation.

### Core Functions

```javascript
// Registration
Kanon.register(id, fn)

// Composition
Kanon.pipe(...functions)      // Left-to-right
Kanon.compose(...functions)   // Right-to-left

// Transformations
Kanon.gain(amount, fn)
Kanon.offset(amount, fn)
Kanon.mix(...functions)
Kanon.clip(fn)
Kanon.softClip(fn)

// Time-based
Kanon.during(start, end, fn)
Kanon.sequence([fn1, dur1], [fn2, dur2], ...)
Kanon.loop(count, duration, fn)
Kanon.loopForever(duration, fn)

// Delays & Feedback
Kanon.delay(delayTime, fn)
Kanon.feedback(delayTime, amount, fn)
Kanon.feedbackY(delayTime, amount, fn)  // Y-combinator version

// Modulation
Kanon.am(modulator, carrier)
Kanon.fm(depth, modulator, carrier)
Kanon.ringMod(modulator, carrier)

// Envelopes
Kanon.envExp(rate, t)
Kanon.envLinear(duration, t)
Kanon.envAD(attack, decay, t)

// Utilities
Kanon.constant(value)
Kanon.silence
Kanon.ramp(a, b, duration, t)
```

---

## Further Reading

- **[Quick Start](quick-start.md)** - Your first Kanon signals
- **[Pure Functions](pure-functions.md)** - Deep dive into functional programming
- **[Composition](composition.md)** - Function composition techniques
- **[Generative Music](generative/)** - Y-combinator, fractals, L-systems
- **[State vs Recursion](../../advanced/state-vs-recursion.md)** - Pure functional approaches

---

## The Beautiful Truth

> "Kanon without Rhythmos is mathematics without music.
> Rhythmos without Kanon is sound without soul."

Use Kanon to **discover the eternal forms**.

Use Rhythmos to **breathe life into them**.

---

**Next**: [Quick Start Guide](quick-start.md) | [Philosophy](../../PHILOSOPHY.md)
