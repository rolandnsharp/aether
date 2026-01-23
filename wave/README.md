# Wave - Pure Functional Audio Synthesis

> A minimal interface for audio synthesis using pure JavaScript functions.

## Philosophy

**Sound is a function: `time → sample`**

That's it. Wave provides:
1. A registry for named functions (hot reload support)
2. Audio output via naudiodon2
3. Optional helper functions (separate npm modules)

Everything else is just JavaScript.

## Quick Start

```javascript
const wave = require('./wave');

// Register a named wave function
wave('sine', t => Math.sin(2 * Math.PI * 440 * t) * 0.3);

// Edit and save - it hot reloads!
```

## Core API

```javascript
// Register a wave
wave(name, fn)              // fn: t => sample OR t => [left, right]

// Manage registry
wave.list()                 // Get all wave names
wave.remove(name)           // Remove a wave
wave.clear()                // Clear all waves
```

That's the entire API. No classes, no builders, no magic.

## Helper Functions (Optional)

Install only what you need:

```bash
npm install @rolandnsharp/wave-fp        # pipe, compose
npm install @rolandnsharp/wave-dsp       # sin, gain, mix, clip, etc.
npm install @rolandnsharp/wave-effects   # reverb, delay, feedback
npm install @rolandnsharp/wave-rhythm    # step, env, euclidean
```

Use them or don't - it's just JavaScript:

```javascript
// Pure JavaScript
wave('pure', t => Math.sin(2 * Math.PI * 440 * t) * 0.3);

// With helpers
const { pipe } = require('@rolandnsharp/wave-fp');
const { sin, gain, clip, reverb } = require('@rolandnsharp/wave-dsp');

wave('composed', pipe(
  sin(440),
  gain(2),
  clip(0.7),
  reverb(0.8),
  gain(0.3)
));

// Mix styles
wave('mixed', t => {
  const bass = Math.sin(2 * Math.PI * 55 * t) * 0.4;
  const lead = pipe(sin(880), gain(2), clip(0.7))(t);
  return bass + lead;
});
```

## Stereo

Stereo signals return `[left, right]`:

```javascript
// Binaural beats
wave('binaural', t => [
  Math.sin(2 * Math.PI * 440 * t) * 0.3,  // Left
  Math.sin(2 * Math.PI * 445 * t) * 0.3   // Right
]);

// Helpers work with both mono and stereo
const { stereo } = require('@rolandnsharp/wave-dsp');

wave('wide', pipe(
  stereo(sin(440), sin(445)),
  gain(0.3)
));
```

## Hot Reload

```bash
node wave-runner.js session.js
```

Edit `session.js` and save - changes apply immediately.

## Comparison to Signal

| Signal (Builder API) | Wave (Pure Functions) |
|---------------------|----------------------|
| `signal('tone').sin(440).gain(0.3)` | `wave('tone', t => Math.sin(2 * Math.PI * 440 * t) * 0.3)` |
| Method chaining | Function composition |
| One way to do things | JavaScript is the API |
| Built-in helpers | Optional helper modules |
| Requires Bun | Works with Node.js |
| Speaker module | naudiodon2 (pro audio) |

## Why Wave?

1. **Minimal** - Core is ~50 lines
2. **Pure** - Functions all the way down
3. **Flexible** - Use any JavaScript you want
4. **Pro Audio** - naudiodon2 for better quality (32-bit float)
5. **Composable** - Build your own abstractions
6. **Hot Reload** - Live coding support
7. **Node Compatible** - Works with Node.js, no special runtime needed

## Technology Choices

- **Runtime:** Node.js (not Bun) - for naudiodon2 compatibility
- **Audio:** naudiodon2 - stable, maintained, 32-bit float, lower latency than Speaker
- **Hot Reload:** File watcher + require cache clearing
- **Philosophy:** Pure functions, optional helpers, JavaScript is the API

## Documentation

- [COMPOSITION-STYLES.md](./COMPOSITION-STYLES.md) - Different ways to compose functions
- More coming soon...

## Status

🚧 **Work in Progress** - This is a fork of Signal being rebuilt from scratch with pure functional principles.

## License

ISC
