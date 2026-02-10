[Home](../Home.md) > [API Reference](#) > Composition-Styles

# Functional Composition Styles for Audio Synthesis

This document explores different ways to compose audio functions in Wave. All approaches are valid - choose what feels right for your use case.

## Core Concept

All audio signals are functions: `time → sample`

```javascript
// A pure sine wave
const sine440 = t => Math.sin(2 * Math.PI * 440 * t);

// At time 0.5 seconds, what's the amplitude?
sine440(0.5); // => some value between -1 and 1
```

Effects are higher-order functions: `(time → sample) → (time → sample)`

```javascript
// Gain is a function that takes a signal and returns a new signal
const gain = amount => signal => t => kanon(t) * amount;

// Apply it
const quietSine = gain(0.5)(sine440);
```

---

## Style 1: Pipe Composition (Left-to-Right)

**Best for:** Live coding, readability, most intuitive

```javascript
const { pipe } = require('@rolandnsharp/wave-fp');

kanon('example', pipe(
  sin(440),           // Start with sine wave
  gain(2),            // Then amplify
  clip(0.7),          // Then clip
  reverb(0.8),        // Then add reverb
  gain(0.3)           // Then adjust output level
));
```

**Pros:**
- Reads like English: "Start with X, then do Y, then do Z"
- Matches signal flow diagrams
- Easy to add/remove steps (just comment out a line)
- Familiar to musicians (like pedal chains)

**Cons:**
- Requires pipe utility function
- Not built into JavaScript

**Implementation:**
```javascript
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
```

---

## Style 2: Compose (Right-to-Left)

**Best for:** Mathematical thinking, traditional FP

```javascript
const { compose } = require('@rolandnsharp/wave-fp');

kanon('example', compose(
  gain(0.3),          // 5. Finally this
  reverb(0.8),        // 4. Then this
  clip(0.7),          // 3. Then this
  gain(2),            // 2. Then this
  sin(440)            // 1. Start here (read bottom-up)
));
```

**Pros:**
- Matches mathematical notation: `(f ∘ g ∘ h)(x)`
- Traditional functional programming style
- Natural for Haskell/ML programmers

**Cons:**
- Reads backwards for most people
- Less intuitive for signal processing

**Implementation:**
```javascript
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);
```

---

## Style 3: Direct Inline Nesting

**Best for:** No dependencies, maximum control, debugging

```javascript
kanon('example',
  gain(0.3)(
    reverb(0.8, 0.6, 0.4)(
      clip(0.7)(
        gain(2)(
          sin(440)
        )
      )
    )
  )
);
```

**Pros:**
- Zero dependencies (no pipe/compose needed)
- Pure function application
- Can inspect each step easily

**Cons:**
- Lisp-like nesting can be hard to read
- Deep chains become unwieldy

**Flattened for readability:**
```javascript
const source = sin(440);
const gained = gain(2)(source);
const clipped = clip(0.7)(gained);
const reverbed = reverb(0.8, 0.6, 0.4)(clipped);
const final = gain(0.3)(reverbed);

kanon('example', final);
```

---

## Style 4: Explicit Direct Computation

**Best for:** Understanding what's happening, performance, debugging

```javascript
kanon('example', t => {
  // Compute each step explicitly
  const source = Math.sin(2 * Math.PI * 440 * t);
  const gained = source * 2;
  const clipped = Math.max(-0.7, Math.min(0.7, gained));
  const reverbed = applyReverb(clipped, t, 0.8, 0.6, 0.4);
  const final = reverbed * 0.3;
  return final;
});
```

**Pros:**
- Zero abstraction - you see exactly what happens
- Easy to debug (set breakpoints, log values)
- No helper functions required
- Most performant (no function call overhead)

**Cons:**
- More verbose
- Less composable
- Can't reuse effect chains easily

---

## Style 5: Point-Free (Tacit) Style

**Best for:** Reusability, abstraction, building libraries

```javascript
// Define reusable chains
const dubEffect = pipe(gain(2), clip(0.7), reverb(0.8, 0.6, 0.4));
const softEffect = pipe(gain(0.5), reverb(0.9, 0.8, 0.5));

// Apply to different sources (no explicit parameters!)
kanon('dub-bass', dubEffect(sin(110)));
kanon('dub-lead', dubEffect(sin(880)));
kanon('soft-pad', softEffect(sin(220)));

// Compose chains
const masterChain = pipe(dubEffect, gain(0.3));
kanon('master', masterChain(sin(440)));
```

**Pros:**
- Highly reusable
- Very functional
- Compositional thinking
- Great for building libraries

**Cons:**
- Can be too abstract
- Harder to debug
- Requires understanding of partial application

---

## Style 6: Mix and Match (Pragmatic)

**Best for:** Real-world use, flexibility, expressiveness

```javascript
kanon('complex', t => {
  // Direct computation for simple things
  const bass = Math.sin(2 * Math.PI * 55 * t) * 0.3;

  // Pipe for effect chains
  const lead = pipe(
    sin(880),
    gain(2),
    clip(0.7),
    reverb(0.8, 0.6, 0.4)
  )(t);

  // Inline nesting for one-offs
  const hihat = gain(0.2)(noise())(t);

  // Point-free for reused chains
  const padEffect = pipe(reverb(0.9), gain(0.15));
  const pad = padEffect(sin(220))(t);

  // Mix everything
  return bass + lead + hihat + pad;
});
```

**Pros:**
- Use the right tool for each situation
- Natural and readable
- Maximum flexibility

**Cons:**
- Less consistent style
- Team needs to agree on conventions

---

## Style 7: Method Chaining (Not Recommended)

**Included for comparison** - this is what Signal's builder API does:

```javascript
// Builder pattern (Signal style)
kanon('example')
  .sin(440)
  .gain(2)
  .clip(0.7)
  .reverb(0.8, 0.6, 0.4)
  .gain(0.3);
```

**Pros:**
- Familiar to OOP programmers
- Fluent interface
- Good IDE autocomplete

**Cons:**
- Requires class/prototype setup
- Locks you into one API
- Can't compose chains as values
- Harder to understand what's happening
- Methods hide the pure functions

**Why we avoid this:** Wave is about pure functions, not objects with methods.

---

## Style 8: Array Pipeline (Future JavaScript)

**Note:** This uses the proposed pipeline operator (not in JavaScript yet)

```javascript
kanon('example',
  sin(440)
    |> gain(2)
    |> clip(0.7)
    |> reverb(0.8)
    |> gain(0.3)
);
```

When/if the pipeline operator lands in JavaScript, this will be the best syntax. Until then, use `pipe`.

---

## Stereo Composition

All styles work with stereo signals (`t => [left, right]`):

```javascript
// Style 1: Pipe with stereo
kanon('stereo', pipe(
  t => [Math.sin(2 * Math.PI * 440 * t), Math.sin(2 * Math.PI * 445 * t)],
  gain(2),              // Works on both channels
  clip(0.7),            // Works on both channels
  width(1.3),           // Stereo-specific effect
  gain(0.3)
));

// Style 2: Direct with stereo
kanon('stereo', t => {
  const left = Math.sin(2 * Math.PI * 440 * t);
  const right = Math.sin(2 * Math.PI * 445 * t);
  return [left * 0.3, right * 0.3];
});

// Style 3: Stereo utilities
const { stereo, monoToStereo } = require('@rolandnsharp/wave-dsp');

kanon('binaural', pipe(
  stereo(sin(440), sin(445)),  // Create stereo from two mono signals
  gain(0.3)
));
```

---

## Complex Real-World Example

```javascript
const wave = require('./wave');
const { pipe } = require('@rolandnsharp/wave-fp');
const { sin, saw, noise, mix, gain, clip, fold } = require('@rolandnsharp/wave-dsp');
const { reverb, feedback, delay, stereo, width, pan } = require('@rolandnsharp/wave-effects');
const { step, env, euclidean } = require('@rolandnsharp/wave-rhythm');

// Using multiple styles together
kanon('dub-techno', t => {
  // Bass: Direct computation (simple enough)
  const { phase: bassPhase } = step(t, 120, 4);
  const bass = Math.sin(2 * Math.PI * 55 * t) * env.exp(bassPhase, 8) * 0.4;

  // Lead: Pipe composition (complex effect chain)
  const lead = pipe(
    t => {
      const { index, phase } = step(t, 120, 16);
      const pattern = euclidean(5, 16);
      if (!pattern[index % 16]) return 0;
      const f = 880 * Math.pow(2, [0, 7, 3, 10][index % 4] / 12);
      return Math.sin(2 * Math.PI * f * t) * env.exp(phase, 12);
    },
    gain(3),
    clip(0.8),
    reverb(0.7, 0.6, 0.4),
    feedback(0.375, 0.5),
    gain(0.25)
  )(t);

  // Pad: Point-free (reusable effect)
  const padEffect = pipe(
    reverb(0.95, 0.8, 0.6),
    width(1.4),
    gain(0.15)
  );

  const pad = padEffect(
    stereo(
      mix(sin(220), sin(220 * 1.005)),
      mix(sin(220), sin(220 * 0.995))
    )
  )(t);

  // Mix: Handle mono + stereo
  const bassL = bass, bassR = bass;
  const leadL = lead, leadR = lead;
  const [padL, padR] = pad;

  return [bassL + leadL + padL, bassR + leadR + padR];
});
```

---

## Recommendations

### For Live Coding
Use **pipe** - it's the most readable and easiest to modify on the fly:
```javascript
kanon('jam', pipe(sin(440), gain(2), clip(0.7), reverb(0.8), gain(0.3)));
```

### For Library Building
Use **point-free** - maximize reusability:
```javascript
const dubChain = pipe(gain(2), clip(0.7), reverb(0.8));
export const dubBass = freq => dubChain(sin(freq));
```

### For Learning
Use **direct computation** - see exactly what's happening:
```javascript
kanon('learn', t => {
  const s = Math.sin(2 * Math.PI * 440 * t);
  return s * 0.3;
});
```

### For Performance
Use **direct computation** - eliminate function call overhead in hot loops:
```javascript
kanon('fast', t => Math.sin(2 * Math.PI * 440 * t) * 0.3);
```

---

## Summary

All these styles are **functionally equivalent** - they produce the same output. Choose based on:

- **Readability:** How easy is it to understand?
- **Context:** Live coding vs library vs learning
- **Team:** What does your team prefer?
- **Performance:** Does it matter for this use case?

The beauty of pure functions is you can mix styles freely. There's no "one true way."

**Wave's philosophy:** Provide the tools (`pipe`, `compose`, helper functions), let users choose their style.
