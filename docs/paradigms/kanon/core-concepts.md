[Home](../Home.md) > [Getting Started](#) > Core Concepts

# Core Concepts

Understanding the philosophy and architecture of Kanon.

## Sound as a Function of Time

The central insight of Kanon:

```
Sound = f(t)
```

Where `t` is time in seconds, and the function returns:
- A number (mono): `-1.0` to `1.0`
- An array (stereo): `[left, right]` where each is `-1.0` to `1.0`

That's it. Everything else is just JavaScript.

## The Pythagorean View

Pythagoras discovered that **harmony is ratio**. He used the **kanon** (monochord) to prove that:
- Octave = 2:1 ratio
- Perfect fifth = 3:2 ratio
- Perfect fourth = 4:3 ratio

In Kanon, we embody this philosophy:

```javascript
const fundamental = t => Math.sin(2 * Math.PI * 220 * t);
const fifth = t => Math.sin(2 * Math.PI * 220 * 1.5 * t);  // 3:2

kanon('harmony', t => (fundamental(t) + fifth(t)) * 0.25);
```

The ratio `1.5` (3:2) is **eternal**. It doesn't "happen" - it simply **is**.

## Time as a Lens

In Kanon's philosophy, the entire soundscape exists as a finished, perfect equation. Time is not a process unfolding, but a **coordinate** through which we observe eternal truth.

```javascript
// This function exists for all time, eternally
const wave = t => Math.sin(2 * Math.PI * 440 * t);

// We can "look" at any moment:
wave(0.0);     // The beginning
wave(5.0);     // Five seconds in
wave(100.0);   // One hundred seconds in
```

The wave doesn't "remember" anything. Every sample is calculated pure from `t`.

## The Core API

```javascript
const kanon = require('@rolandnsharp/kanon');

// Register a function
kanon('name', t => /* return sample */);

// List all registered functions
kanon.list();  // ['name']

// Remove a function
kanon.remove('name');

// Clear all functions
kanon.clear();
```

That's the entire API. No classes, no state, no magic.

## Pure Functions

A Kanon function is **pure**:
- Same input (`t`) always returns same output
- No side effects
- No hidden state
- No randomness (unless intended)

```javascript
// Pure - deterministic
kanon('pure', t => Math.sin(2 * Math.PI * 440 * t));

// Impure - different every time (intentional randomness)
kanon('noise', t => Math.random() * 2 - 1);
```

## Composing Functions

Since everything is functions, we use function composition:

```javascript
const { pipe, gain, mix } = require('@rolandnsharp/kanon/src/functional');

// Create reusable building blocks
const sin = f => t => Math.sin(2 * Math.PI * f * t);
const multiply = x => y => x * y;

// Compose them
kanon('composed', pipe(
  sin(440),
  multiply(0.3)
));

// Or mix multiple sources
const bass = sin(110);
const mid = sin(220);
const high = sin(440);

kanon('triad', t => (bass(t) + mid(t) + high(t)) * 0.2);
```

## Mono vs Stereo

**Mono**: Return a single number

```javascript
kanon('mono', t => Math.sin(2 * Math.PI * 440 * t) * 0.3);
```

**Stereo**: Return `[left, right]`

```javascript
kanon('stereo', t => [
  Math.sin(2 * Math.PI * 440 * t) * 0.3,  // Left
  Math.sin(2 * Math.PI * 442 * t) * 0.3   // Right
]);
```

Mono signals are automatically copied to both channels.

## The Registry

The registry is a simple Map of `name → function`. When audio renders, it calls every registered function with the current time `t` and mixes the results.

```javascript
// Register multiple functions
kanon('bass', t => Math.sin(2 * Math.PI * 55 * t) * 0.4);
kanon('lead', t => Math.sin(2 * Math.PI * 880 * t) * 0.2);

// They mix automatically
// output = bass(t) + lead(t)
```

## Hot Reloading

The runner watches your session file. When you save:
1. Clears the require cache
2. Calls `kanon.clear()`
3. Re-imports your session file
4. New functions register
5. Audio continues without clicking

This enables live coding - surgical changes without stopping the music.

## Mathematical Purity

In Kanon, we explore:
- **Divine Proportions**: Golden ratio (φ = 1.618...), Fibonacci sequences
- **Perfect Ratios**: 3:2, 4:3, 5:4, 9:8
- **Fractal Structures**: Self-similar patterns across time scales
- **Spectral Relationships**: Fourier transforms, harmonics

All expressed as pure functions of time.

## Comparison to Other Approaches

### Traditional Audio Graph
```
OscillatorNode → GainNode → DestinationNode
```
- Object-oriented
- Stateful nodes
- Mutable connections

### Kanon
```
t → f(t) → sample
```
- Functional
- Stateless (or explicit memoization)
- Immutable mathematics

## The Kanon-Flux Duality

Kanon is one half of a philosophical duality:

- **Kanon**: `f(t)` - Eternal geometry, Pythagorean "All is Number"
- **Flux**: `f(state)` - Living process, Heraclitean "Everything Flows"

See [Kanon-Flux Duality](../5-mathematical-foundations/Kanon-Flux-Duality.md) for the complete philosophy.

## Key Principles

1. **Sound is Number**: Every audio phenomenon can be expressed mathematically
2. **Time is Space**: We don't simulate - we observe existing structures
3. **Purity**: Functions are deterministic and composable
4. **Simplicity**: Minimal API, maximum expressiveness
5. **JavaScript is the DSL**: No custom syntax, just functions

## Example: A Perfect Fifth

```javascript
const kanon = require('@rolandnsharp/kanon');

// The ratio 3:2 is eternal
kanon('fifth', t => {
  const root = 220;  // A3
  const fundamental = Math.sin(2 * Math.PI * root * t);
  const fifth = Math.sin(2 * Math.PI * root * 1.5 * t);

  return (fundamental + fifth) * 0.25;
});
```

This isn't a "simulation" of a fifth. It **is** a fifth, expressed as mathematical truth.

## Next Steps

- **[Quick Start](Quick-Start.md)** - Make your first sounds
- **[Why Bun?](Why-Bun.md)** - Understanding tail call optimization
- **[Examples](../2-api-reference/Examples.md)** - More code examples
- **[Kanon-Flux Duality](../5-mathematical-foundations/Kanon-Flux-Duality.md)** - Deep philosophy

## Related Topics

- **Synthesis**: [Delay and Feedback](../3-synthesis-techniques/Delay-And-Feedback.md)
- **Composition**: [Composition Styles](../2-api-reference/Composition-Styles.md)
- **Mathematics**: [Fourier Transform](../5-mathematical-foundations/Fourier-Transform.md)
- **Advanced**: [Y-Combinator](../4-generative-music/Y-Combinator.md)

---

*"In the beginning was the Number (Kanon). And the Number became Sound."*

**Previous**: [Quick Start](Quick-Start.md) | **Next**: [Why Bun?](Why-Bun.md)
