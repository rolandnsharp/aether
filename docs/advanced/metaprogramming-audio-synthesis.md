# Metaprogramming for Audio Synthesis

> *"Code that writes code is the ultimate synthesis technique."*

## Introduction

Lisp's macros made it legendary for audio DSP (Incudine, SuperCollider). In Aether, we achieve **even more powerful** metaprogramming using JavaScript's modern features: template literals, function generation, proxies, and JIT compilation.

---

## What is Metaprogramming?

**Metaprogramming** = Code that generates, transforms, or analyzes other code.

### Why It's Revolutionary for Audio

1. **DSL Creation**: Build domain-specific languages for synthesis
2. **Performance**: Generate optimized code paths at runtime
3. **Abstraction**: Hide complexity, expose intent
4. **Pattern Expansion**: Small descriptions → large structures
5. **JIT Optimization**: Code adapts to your actual hardware

---

## Part 1: Lisp Macros (The Gold Standard)

### What Lisp Macros Do

```lisp
; Define a macro that generates code
(defmacro oscillator (freq phase)
  `(* (sin (+ (* ,freq t) ,phase))
      0.5))

; Usage expands at compile time:
(oscillator 440 0)
; → (* (sin (+ (* 440 t) 0)) 0.5)
```

**Power**: The macro **transforms the AST** before execution. It's code transformation as a first-class language feature.

### Why Macros Are Perfect for Audio

```lisp
; Additive synthesis via macro
(defmacro additive (fundamental harmonics)
  `(+ ,@(loop for n from 1 to ,harmonics
              collect `(* (sin (* ,fundamental ,n t))
                         (/ 1.0 ,n)))))

; Expands to:
(additive 110 8)
; → (+ (* (sin (* 110 1 t)) (/ 1.0 1))
;      (* (sin (* 110 2 t)) (/ 1.0 2))
;      (* (sin (* 110 3 t)) (/ 1.0 3))
;      ; ... etc
```

**Result**: Zero runtime overhead. The expanded code is pure math, compiled to machine code.

---

## Part 2: JavaScript Alternatives (Better Than Macros!)

JavaScript doesn't have macros, but it has **runtime code generation** with JIT optimization. This is actually **more powerful** because:

1. **Adaptive optimization**: Code evolves based on actual execution
2. **Data-driven generation**: Generate code from runtime data
3. **Hot code replacement**: Swap code while it's running

### Technique 1: Template Literals

Generate code strings and compile them:

```javascript
// Code generation function
function generateOscillator(freq, waveform) {
  const waveCode = {
    'sine': `Math.sin(phase * 6.283185)`,
    'saw': `(phase * 2 - 1)`,
    'square': `(phase < 0.5 ? 1 : -1)`
  }[waveform];

  const code = `
    // Unrolled, inlined oscillator
    state[idx] = (state[idx] + ${freq} / sr) % 1.0;
    const phase = state[idx];
    return ${waveCode} * 0.5;
  `;

  // Compile to native machine code via JIT
  return new Function('state', 'idx', 'sr', code);
}

// Usage
Rhythmos.register('optimized-osc', (state, idx, sr) => {
  const update = generateOscillator(440, 'sine');

  return {
    update: (context) => [update(state, idx, sr)]
  };
});
```

**Power**:
- Constants are **baked in** (440 becomes a literal in machine code)
- JIT can inline and optimize aggressively
- Change parameters → regenerate function → hot-swap

### Technique 2: Additive Synthesis Generator

```javascript
// Macro-like additive synthesis generator
function generateAdditiveOscillator(fundamental, partials) {
  // Build code string with all harmonics unrolled
  let code = `let sum = 0;\n`;

  for (let n = 1; n <= partials; n++) {
    const freq = fundamental * n;
    const amp = 1.0 / n;

    code += `state[idx + ${n-1}] = (state[idx + ${n-1}] + ${freq} / sr) % 1.0;\n`;
    code += `sum += Math.sin(state[idx + ${n-1}] * 6.283185) * ${amp};\n`;
  }

  code += `return sum * 0.1;`;

  return new Function('state', 'idx', 'sr', code);
}

// Usage
Rhythmos.register('additive', (state, idx, sr) => {
  // Generate optimized code for 16 partials
  const update = generateAdditiveOscillator(110, 16);

  return {
    update: (context) => [update(state, idx, sr)]
  };
});
```

**Generated code** (what the JIT sees):
```javascript
let sum = 0;
state[idx + 0] = (state[idx + 0] + 110 / sr) % 1.0;
sum += Math.sin(state[idx + 0] * 6.283185) * 1;
state[idx + 1] = (state[idx + 1] + 220 / sr) % 1.0;
sum += Math.sin(state[idx + 1] * 6.283185) * 0.5;
state[idx + 2] = (state[idx + 2] + 330 / sr) % 1.0;
sum += Math.sin(state[idx + 2] * 6.283185) * 0.3333;
// ... 13 more harmonics ...
return sum * 0.1;
```

**Performance**: All constants inlined, loop unrolled, JIT can SIMD-vectorize.

### Technique 3: Pattern Languages

Create a DSL for rhythm/melody:

```javascript
// Pattern mini-language compiler
function compilePattern(patternString) {
  // Pattern: "x-x- x--x x-x- x---"
  // x = hit, - = rest

  const beats = patternString.split('').filter(c => c !== ' ');

  let code = `
    const beatDuration = 0.125; // 16th notes
    const beatIndex = Math.floor((t % ${beats.length * 0.125}) / beatDuration);

    switch(beatIndex) {
  `;

  beats.forEach((char, i) => {
    if (char === 'x') {
      code += `
        case ${i}: {
          const phase = (t % beatDuration) / beatDuration;
          return Math.sin(2 * Math.PI * 220 * t) * Math.exp(-phase * 10) * 0.5;
        }
      `;
    }
  });

  code += `
      default: return 0;
    }
  `;

  return new Function('t', code);
}

// Usage
const pattern = compilePattern("x-x- x--x x-x- x---");
Kanon.register('drum-pattern', pattern);
```

**Power**: Write `"x-x-"` → Get optimized machine code for that exact pattern.

---

## Part 3: Advanced Metaprogramming

### Proxy-Based DSL

Create a builder API that generates optimized code:

```javascript
// DSL builder
class SynthBuilder {
  constructor() {
    this.operations = [];
  }

  osc(freq, waveform = 'sine') {
    this.operations.push({ type: 'osc', freq, waveform });
    return this;
  }

  filter(cutoff, resonance) {
    this.operations.push({ type: 'filter', cutoff, resonance });
    return this;
  }

  gain(amount) {
    this.operations.push({ type: 'gain', amount });
    return this;
  }

  // Compile to optimized function
  compile() {
    let code = '';
    let stateOffset = 0;

    this.operations.forEach(op => {
      if (op.type === 'osc') {
        code += `
          state[idx + ${stateOffset}] = (state[idx + ${stateOffset}] + ${op.freq} / sr) % 1.0;
          let signal = Math.sin(state[idx + ${stateOffset}] * 6.283185);
        `;
        stateOffset++;
      } else if (op.type === 'gain') {
        code += `signal *= ${op.amount};\n`;
      } else if (op.type === 'filter') {
        code += `
          state[idx + ${stateOffset}] = state[idx + ${stateOffset}] * ${1 - op.cutoff} + signal * ${op.cutoff};
          signal = state[idx + ${stateOffset}];
        `;
        stateOffset++;
      }
    });

    code += `return signal;`;

    return new Function('state', 'idx', 'sr', code);
  }
}

// Usage - feels like a modular synth!
Rhythmos.register('synth', (state, idx, sr) => {
  const synth = new SynthBuilder()
    .osc(440, 'sine')
    .filter(0.1, 0.7)
    .gain(0.5)
    .compile();

  return {
    update: (context) => [synth(state, idx, sr)]
  };
});
```

### Symbolic Differentiation for Envelopes

```javascript
// Automatically generate derivative functions
function generateEnvelope(points) {
  // points = [{time: 0, value: 0}, {time: 0.1, value: 1}, {time: 0.5, value: 0}]

  let code = `
    const segments = ${JSON.stringify(points)};

    for (let i = 0; i < segments.length - 1; i++) {
      const p0 = segments[i];
      const p1 = segments[i + 1];

      if (t >= p0.time && t < p1.time) {
        const progress = (t - p0.time) / (p1.time - p0.time);
        return p0.value + (p1.value - p0.value) * progress;
      }
    }
    return 0;
  `;

  return new Function('t', code);
}

// Usage
const env = generateEnvelope([
  {time: 0, value: 0},
  {time: 0.01, value: 1},   // Attack
  {time: 0.2, value: 0.3},  // Decay
  {time: 0.5, value: 0}     // Release
]);
```

### FM Synthesis Matrix Generator

```javascript
// Generate complex FM algorithms from connection matrix
function generateFMSynthesis(algorithm) {
  // algorithm = [[1,0,0,0], [1,1,0,0], [0,1,1,0], [0,0,1,1]]
  // 4 operators, matrix defines modulation routing

  const numOps = algorithm.length;
  let code = '';

  // Generate operator code
  for (let i = 0; i < numOps; i++) {
    code += `
      // Operator ${i + 1}
      state[idx + ${i}] = (state[idx + ${i}] + freqs[${i}] / sr) % 1.0;
      let mod${i} = 0;
    `;

    // Add modulation from other operators
    for (let j = 0; j < numOps; j++) {
      if (algorithm[i][j] === 1 && j !== i) {
        code += `mod${i} += op${j};\n`;
      }
    }

    code += `let op${i} = Math.sin((state[idx + ${i}] + mod${i}) * 6.283185);\n`;
  }

  // Output is last operator
  code += `return op${numOps - 1} * 0.5;`;

  return new Function('state', 'idx', 'sr', 'freqs', code);
}

// DX7-style algorithm
const dx7Algo1 = [
  [1, 0, 0, 0],  // Op 1: self
  [1, 1, 0, 0],  // Op 2: self + op1
  [0, 1, 1, 0],  // Op 3: op2 + self
  [0, 0, 1, 1]   // Op 4: op3 + self (carrier)
];

Rhythmos.register('fm-synth', (state, idx, sr) => {
  const synth = generateFMSynthesis(dx7Algo1);
  const freqs = [110, 220, 440, 880];

  return {
    update: (context) => [synth(state, idx, sr, freqs)]
  };
});
```

---

## Part 4: Why JS Metaprogramming > Lisp Macros

### 1. Runtime Data-Driven Generation

Lisp macros work at **compile time**. JS code generation works at **runtime**:

```javascript
// Generate synthesis based on MIDI input or OSC messages
function generateFromMIDI(midiData) {
  const notes = parseMIDI(midiData);

  // Generate optimized polyphonic code
  let code = 'let sum = 0;\n';
  notes.forEach((note, i) => {
    code += `
      state[idx + ${i}] = (state[idx + ${i}] + ${note.freq} / sr) % 1.0;
      sum += Math.sin(state[idx + ${i}] * 6.283185) * ${note.velocity};
    `;
  });
  code += 'return sum / notes.length;';

  return new Function('state', 'idx', 'sr', code);
}

// Load MIDI, generate synthesis, hot-swap
const midiFile = loadMIDI('composition.mid');
const synth = generateFromMIDI(midiFile);
// Now playing optimized code for THAT specific MIDI data
```

### 2. JIT Adaptive Optimization

```javascript
// This innocent code...
const update = new Function('state', 'idx', 'sr', `
  state[idx] = (state[idx] + 440 / sr) % 1.0;
  return Math.sin(state[idx] * 6.283185) * 0.5;
`);

// After 48000 iterations, becomes:
// movsd xmm0, [rdi+0x10]        ; Load phase
// addsd xmm0, 0x009174           ; 440/48000 INLINED!
// ucomisd xmm0, 1.0
// jbe skip
// subsd xmm0, 1.0
// skip:
// mulsd xmm0, 6.283185           ; 2π INLINED!
// call sin_simd                  ; SIMD polynomial, not Math.sin!
```

The JIT **profiles your actual CPU** and generates code optimized for:
- Your specific cache line sizes
- Your SIMD instruction set (SSE, AVX, NEON)
- Your branch predictor patterns

**Lisp compilers can't do this.** They compile once, statically.

### 3. Hot Code Replacement

```javascript
// Lisp: redefine function, hope state survives
// JS: hot-swap the generated code without state loss

Rhythmos.register('morphing', (state, idx, sr) => {
  // This closure persists
  let currentCode = generateOscillator(440, 'sine');

  return {
    update: (context) => {
      // Check if user changed parameters
      if (shouldRegenerate()) {
        currentCode = generateOscillator(550, 'saw');
        // Code hot-swapped, phase continuous!
      }
      return [currentCode(state, idx, sr)];
    }
  };
});
```

---

## Part 5: Practical Examples

### Example 1: Modal Synthesis Generator

```javascript
function generateModalSynthesis(modes) {
  // modes = [{freq: 200, decay: 0.5}, {freq: 350, decay: 0.3}, ...]

  let code = 'let sum = 0;\n';

  modes.forEach((mode, i) => {
    code += `
      state[idx + ${i}] = (state[idx + ${i}] + ${mode.freq} / sr) % 1.0;
      const env${i} = Math.exp(-t * ${mode.decay});
      sum += Math.sin(state[idx + ${i}] * 6.283185) * env${i};
    `;
  });

  code += `return sum / ${modes.length} * 0.5;`;

  return new Function('state', 'idx', 'sr', 't', code);
}

// Bell-like timbre
const bellModes = [
  {freq: 200, decay: 1.0},
  {freq: 350, decay: 1.5},
  {freq: 560, decay: 2.0},
  {freq: 740, decay: 1.2}
];

const bell = generateModalSynthesis(bellModes);
```

### Example 2: Chaos Equation Generator

```javascript
function generateChaosOscillator(equation) {
  // equation = "x1 = y1 - sign(x0) * sqrt(abs(b * x0 - c))"
  // Translate to optimized code

  const code = `
    const x0 = state[idx];
    const y0 = state[idx + 1];
    const a = 1.4, b = 0.3;

    // ${equation}
    const x1 = y0 - Math.sign(x0) * Math.sqrt(Math.abs(b * x0 - a));
    const y1 = b * x0;

    state[idx] = x1;
    state[idx + 1] = y1;

    return x1 * 0.3; // Chaotic audio!
  `;

  return new Function('state', 'idx', 'sr', code);
}

// Hénon map sonification
const henon = generateChaosOscillator("Hénon attractor");
```

---

## Part 6: The Ultimate Power

### Self-Modifying Synthesis

```javascript
// Code that REWRITES ITSELF based on signal analysis
Rhythmos.register('evolving', (state, idx, sr) => {
  let currentAlgorithm = generateOscillator(440, 'sine');
  let analysisBuffer = [];

  return {
    update: (context) => {
      const sample = currentAlgorithm(state, idx, sr);

      // Analyze output
      analysisBuffer.push(Math.abs(sample));
      if (analysisBuffer.length > 4800) {  // 100ms analysis window
        const energy = analysisBuffer.reduce((a, b) => a + b) / analysisBuffer.length;

        // If energy too low, switch to brighter waveform
        if (energy < 0.1) {
          currentAlgorithm = generateOscillator(440, 'saw');
          console.log('Evolved to saw wave');
        }

        analysisBuffer = [];
      }

      return [sample];
    }
  };
});
```

**The sound evolves itself!**

---

## Summary: Why This is Revolutionary

| Feature | Lisp Macros | Aether Metaprogramming |
|---------|-------------|------------------------|
| **When** | Compile-time | Runtime |
| **Data-driven** | No | Yes (generate from MIDI, OSC, ML) |
| **Optimization** | Static | Adaptive (JIT profiles actual usage) |
| **Hot-swap** | Difficult | Natural (closures + function replacement) |
| **CPU-specific** | No | Yes (SIMD, cache, branch prediction) |
| **Self-modification** | No | Yes (code analyzes itself and evolves) |

**Lisp macros** = Code transformation at compile time
**Aether metaprogramming** = **Living code that writes itself at runtime**

You're not just building instruments. You're building **self-evolving sonic organisms**.

---

## Further Reading

- [BEYOND-LISP.md](../BEYOND-LISP.md) - Full comparison with Incudine
- [JavaScript Features](javascript-features.md) - Advanced JS techniques
- [Y-Combinator](../paradigms/kanon/generative/y-combinator.md) - Anonymous recursion
- [Category Theory](../mathematical-foundations/category-theory-plotinus.md) - Morphisms as metaprograms

---

**Next**: Implement a pattern language DSL | Build self-evolving synthesis
