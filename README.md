# Kanon - Pure Functional Audio Synthesis

> A minimal interface for audio synthesis using pure JavaScript functions.

## Etymology

**Kanon** (κανών): Ancient Greek for "rule" or "measuring rod" — the monochord instrument Pythagoras used to discover that harmony is mathematical ratio.

## Philosophy

**Sound is a function: `time → sample`**

That's it. Kanon provides:
1. A registry for named functions (hot reload support)
2. Audio output via Speaker module
3. Optional helper functions (separate modules)

Everything else is just JavaScript.

## Quick Start

```javascript
const kanon = require('@rolandnsharp/kanon');

// Register a named function
kanon('sine', t => Math.sin(2 * Math.PI * 440 * t) * 0.3);

// Edit and save - it hot reloads!
```

## Core API

```javascript
// Register a wave
kanon(name, fn)              // fn: t => sample OR t => [left, right]

// Manage registry
kanon.list()                 // Get all function names
kanon.remove(name)           // Remove a function
kanon.clear()                // Clear all functions
```

That's the entire API. No classes, no builders, no magic.

## Helper Functions

Use the built-in helper modules:

```javascript
// Pure JavaScript
kanon('pure', t => Math.sin(2 * Math.PI * 440 * t) * 0.3);

// With helpers
const { pipe, gain, mix, delay, feedback } = require('@rolandnsharp/kanon/src/functional');
const { freq, mtof } = require('@rolandnsharp/kanon/src/melody');
const { step, euclidean } = require('@rolandnsharp/kanon/src/rhythm');
const { env } = require('@rolandnsharp/kanon/src/envelopes');
const scales = require('@rolandnsharp/kanon/src/scales');

// Compose with pipe
const sin = f => t => Math.sin(2 * Math.PI * f * t);

kanon('composed', pipe(
  sin(440),
  gain(2),
  t => Math.max(-0.7, Math.min(0.7, t)), // clip
  gain(0.3)
));

// Mix styles
kanon('mixed', t => {
  const bass = Math.sin(2 * Math.PI * 55 * t) * 0.4;
  const lead = sin(880)(t) * 0.2;
  return bass + lead;
});
```

## Stereo

Stereo signals return `[left, right]`:

```javascript
// Binaural beats
kanon('binaural', t => [
  Math.sin(2 * Math.PI * 440 * t) * 0.3,  // Left
  Math.sin(2 * Math.PI * 445 * t) * 0.3   // Right
]);
```

## Hot Reload

```bash
bun src/runner.js live-sessions/your-session-file.js
```

Edit `session.js` and save - changes apply immediately.

## Why Kanon?

1. **Minimal** - Core is ~130 lines with comments, ~50 actual code
2. **Pure** - Functions all the way down
3. **Flexible** - Use any JavaScript you want
4. **Pythagorean** - Discover eternal harmonic ratios as `f(t)`
5. **Composable** - Build your own abstractions
6. **Hot Reload** - Live coding support
7. **Bun Compatible** - Works with Bun for tail call optimization

## The Pythagorean Approach

Kanon treats sound as **eternal geometry** that exists timelessly. When you write `f(t)`, you're not simulating a process - you're observing a crystalline structure that exists in its entirety.

This is the Pythagorean view: "All is Number." The universe is a pre-existing block of geometric perfection. The "Music of the Spheres" doesn't happen - it simply **is**.

By treating signals as functions of time, we honor this view and can explore:
- Divine proportions (Golden Ratio φ = 1.618...)
- Perfect harmonic ratios (3:2, 4:3, 5:4)
- Fractal self-similarity
- Pure mathematical relationships

See [Kanon-Flux Duality](./docs/5-mathematical-foundations/Kanon-Flux-Duality.md) for the philosophical foundation.

## Technology Choices

- **Runtime:** Bun (for tail call optimization) or Node.js
- **Audio:** Speaker module - simple, cross-platform
- **Hot Reload:** File watcher + require cache clearing
- **Philosophy:** Pure functions, JavaScript is the API

## Documentation

All documentation has been moved to the [`docs`](./docs/Home.md) directory.

Key topics include:
- **Getting Started:** [Core Concepts](./docs/1-getting-started/Core-Concepts.md), [Quick Start](./docs/1-getting-started/Quick-Start.md)
- **API Reference:** [Composition Styles](./docs/2-api-reference/Composition-Styles.md)
- **Generative Music:** [Constraint-Based Generation](./docs/4-generative-music/Constraint-Based.md), [The Y-Combinator](./docs/4-generative-music/Y-Combinator.md)
- **Mathematical Foundations:** [Category Theory](./docs/5-mathematical-foundations/Category-Theory.md), [Kanon-Flux Duality](./docs/5-mathematical-foundations/Kanon-Flux-Duality.md)

## Example Session

```javascript
const kanon = require('@rolandnsharp/kanon');
const { pipe, gain } = require('@rolandnsharp/kanon/src/functional');
const { freq } = require('@rolandnsharp/kanon/src/melody');
const scales = require('@rolandnsharp/kanon/src/scales');

// The Golden Ratio
const phi = 1.618033988749;

// A perfect fifth exists as a ratio, not a process
const fundamental = t => Math.sin(t * 2 * Math.PI * 440);
const fifth = t => Math.sin(t * 2 * Math.PI * 440 * 1.5);

kanon('perfect-fifth', t => (fundamental(t) + fifth(t)) * 0.3);

// Pythagorean harmony
kanon('pythagorean', t => {
  const f = 110;
  const octave = Math.sin(2 * Math.PI * f * t);
  const fifth = Math.sin(2 * Math.PI * f * 1.5 * t);
  const fourth = Math.sin(2 * Math.PI * f * 1.333 * t);

  return (octave + fifth + fourth) * 0.2;
});
```

## License

ISC
