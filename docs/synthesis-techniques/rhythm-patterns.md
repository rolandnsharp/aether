[Home](../Home.md) > [API Reference](#) > Drum-Loop-Patterns

# Drum Loop Patterns - API Design Options

This document explores different approaches for creating drum loops in the Signal library, from functional to imperative styles.

## Current Approach: Functional with Object Destructuring

```javascript
const { index, phase } = step(t, 120, 16);
const pattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
if (!pattern[index % pattern.length]) return 0;
if (phase > 0.3) return 0;
return kickSound(phase, t);
```

**Pros:**
- Flexible - can destructure only what you need: `const { phase } = step(...)`
- Self-documenting property names
- Already implemented and working

**Cons:**
- Requires understanding of destructuring
- Pattern checking is separate step

---

## Option 1: Descriptive Function Names

### A. drumStep / beatStep
```javascript
const { index, phase } = drumStep(t, 120, 16);
const pattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
if (!pattern[index % pattern.length]) return 0;
```

**Pros:** More obvious this is for rhythm/drums
**Cons:** Still requires separate pattern check

---

## Option 2: Integrated Pattern Checking

### A. pattern() function
```javascript
const { hit, phase } = pattern(t, 120, 16, [1, 0, 1, 0]);
if (!hit) return 0;
if (phase > 0.3) return 0;
return kickSound(phase, t);
```

**Pros:** Clearest intent - "is there a hit on this step?"
**Cons:** Less flexible if you need index separately

### B. step() with optional pattern
```javascript
const { index, phase, trigger } = step(t, 120, 16, [1, 0, 1, 0]);
if (!trigger) return 0;
```

**Pros:** Extends existing API without breaking changes
**Cons:** Optional parameter might be confusing

### C. onBeats() helper
```javascript
const drum = onBeats(t, 120, 16, [1, 0, 0, 0]);
if (!drum.active) return 0;
// drum.phase available
```

**Pros:** Reads like English: "on beats matching this pattern"
**Cons:** Different naming convention

---

## Option 3: String-Based Pattern Notation

### A. Visual drum machine style
```javascript
kanon('kick', t =>
  drum(t, 120, 'x...x...x...x...', phase => {
    if (phase > 0.3) return 0;
    const f = 50 + 80 * env.exp(phase, 20);
    return signal.sin(f).eval(t) * 0.4;
  })
);
```

**Pros:**
- Visual pattern makes rhythm instantly obvious
- x = hit, . = rest is drum machine standard
- Pattern length is visible at a glance

**Cons:**
- Limited to binary on/off (no velocity/accent support)
- Need to parse strings

### B. Extended notation with accents
```javascript
// x = hit, X = accent, . = rest, - = ghost note
drum(t, 120, 'X...x...X...x...')

// Or with velocity values
drum(t, 120, '9.4.9.4.', phase => /* 9 = loud, 4 = soft */)
```

---

## Option 4: Step Sequencer Builder Pattern

### A. Method chaining
```javascript
const kick = sequence('kick', 120)
  .steps(16)
  .pattern([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])
  .gateLength(0.3)
  .sound((phase, t) => {
    const f = 50 + 80 * env.exp(phase, 20);
    return signal.sin(f).eval(t) * 0.4;
  });
```

**Pros:**
- Reads like configuration steps
- Easy to add features (swing, velocity, etc.)
- Familiar to users of DAWs

**Cons:**
- More verbose
- Introduces builder pattern complexity

### B. Configuration object
```javascript
kanon('kick', t =>
  drumLoop(t, {
    bpm: 120,
    steps: 16,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    gateLength: 0.3  // phase cutoff
  }, (phase) => {
    const f = 50 + 80 * env.exp(phase, 20);
    return signal.sin(f).eval(t) * 0.4;
  })
);
```

**Pros:**
- All configuration in one place
- Self-documenting with property names
- Easy to add optional parameters

**Cons:**
- More boilerplate
- Still uses callbacks

---

## Option 5: English-like API

### A. when/on style
```javascript
onBeat('kick', 120, every(4).steps)
  .do((phase, t) => {
    if (phase > 0.3) return 0;
    return kickSound(phase, t);
  });
```

**Pros:** Reads like natural language
**Cons:** More functions to learn, chainable API

### B. whenPattern style
```javascript
whenPattern([1, 0, 0, 0], 120, 16)
  .trigger('kick', (phase, t) => kickSound(phase, t));
```

---

## Option 6: Imperative Loop-Based Approaches

### A. For-of loop with explicit beat list
```javascript
kanon('kick', t => {
  const { index, phase } = step(t, 120, 16);
  const stepInLoop = index % 16;

  // Check each beat where kick should hit
  for (let beat of [0, 4, 8, 12]) {
    if (stepInLoop === beat) {
      if (phase > 0.3) return 0;
      const f = 50 + 80 * env.exp(phase, 20);
      return signal.sin(f).eval(t) * 0.4;
    }
  }

  return 0; // No hit on this step
});
```

**Pros:**
- Very explicit about which beats hit
- No array lookup
- Clear control flow

**Cons:**
- Less efficient
- More verbose

### B. Pattern builder with for loop (Recommended Imperative)
```javascript
// Build pattern imperatively - very clear intent
const kickPattern = [];
for (let step = 0; step < 16; step++) {
  if (step === 0 || step === 4 || step === 8 || step === 12) {
    kickPattern[step] = 1;  // Hit
  } else {
    kickPattern[step] = 0;  // Rest
  }
}

// Or more concise
const kickPattern = [];
for (let step = 0; step < 16; step++) {
  kickPattern[step] = (step % 4 === 0) ? 1 : 0;  // Four on the floor
}

kanon('kick', t => {
  const { index, phase } = step(t, 120, 16);
  if (!kickPattern[index % 16]) return 0;
  if (phase > 0.3) return 0;
  return kickSound(phase, t);
});
```

**Pros:**
- Maximally explicit and imperative
- Easy to understand for beginners
- Pattern construction is visible and modifiable
- Natural JS style

**Cons:**
- Separate pattern definition step
- More lines of code

### C. While loop for checking hits
```javascript
kanon('kick', t => {
  const { index, phase } = step(t, 120, 16);

  // Check if index matches any kick position
  let stepNum = 0;
  while (stepNum < 16) {
    if (index % 16 === stepNum && stepNum % 4 === 0) {
      if (phase > 0.3) return 0;
      return kickSound(phase, t);
    }
    stepNum++;
  }
  return 0;
});
```

**Pros:** Very imperative
**Cons:** Inefficient, runs on every sample

### D. For loop to check active steps
```javascript
kanon('kick', t => {
  const { index, phase } = step(t, 120, 16);

  // Loop through active steps to see if current index matches
  const hits = [0, 4, 8, 12];
  let shouldHit = false;
  for (let i = 0; i < hits.length; i++) {
    if (index % 16 === hits[i]) {
      shouldHit = true;
      break;
    }
  }

  if (!shouldHit) return 0;
  if (phase > 0.3) return 0;
  return kickSound(phase, t);
});
```

**Pros:** Explicit control flow, easy to debug
**Cons:** More verbose

---

## Option 7: Named Pattern Constants

```javascript
// In rhythm.js or user code
const PATTERNS = {
  KICK_4_4: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  BACKBEAT: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  OFFBEAT: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]
};

kanon('kick', t => {
  const { index, phase } = step(t, 120, 16);
  if (!PATTERNS.KICK_4_4[index % 16]) return 0;
  if (phase > 0.3) return 0;
  return kickSound(phase, t);
});
```

**Pros:**
- Self-documenting pattern names
- Reusable across signals
- Easy to build library of common patterns

**Cons:**
- Need to maintain pattern library

---

## Comparison Table

| Approach | Clarity | Brevity | Flexibility | Imperative | Beginner-Friendly |
|----------|---------|---------|-------------|------------|-------------------|
| Current (object destructure) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| pattern() helper | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| String notation | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| Builder pattern | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Loop builder | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| For-of check | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Named constants | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Recommendations

### For Maximum Clarity in Drum Loops
**String notation + Config object:**
```javascript
kanon('kick', t =>
  drum(t, {
    bpm: 120,
    pattern: 'x...x...x...x...',
    gate: 0.3
  }, phase => kickSound(phase, t))
);
```

### For Maximum Imperative Style
**Loop-based pattern builder:**
```javascript
const kickPattern = [];
for (let step = 0; step < 16; step++) {
  kickPattern[step] = (step % 4 === 0) ? 1 : 0;
}

kanon('kick', t => {
  const { index, phase } = step(t, 120, 16);
  if (!kickPattern[index % 16]) return 0;
  if (phase > 0.3) return 0;
  return kickSound(phase, t);
});
```

### For Beginner-Friendliness
**Named pattern constants + simple API:**
```javascript
const KICK = 'x...x...x...x...';

kanon('kick', t => {
  const { hit, phase } = pattern(t, 120, 16, KICK);
  if (!hit || phase > 0.3) return 0;
  return kickSound(phase, t);
});
```

### For Power Users
**Keep current approach** - it's flexible, concise, and functional programming style fits the Signal paradigm.

---

## Implementation Priority

1. **Add string pattern support** - biggest clarity win
2. **Add pattern() helper** - returns {hit, phase} for cleaner checks
3. **Export common patterns as constants** - PATTERNS.KICK_4_4, etc.
4. **Document loop-based pattern building** - add examples to docs
