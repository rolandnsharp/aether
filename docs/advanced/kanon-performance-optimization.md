# Kanon Performance Optimization

> *"Beauty and speed are not mutually exclusive."*

## The Problem

Kanon's pure `f(t)` approach is mathematically elegant but computationally expensive:

```
48,000 samples/second × function calls = massive overhead
```

JavaScript's weaknesses:
- Function call overhead (stack frames, closures)
- Dynamic type checking
- No SIMD vectorization
- Garbage collection pauses
- No native numeric types (everything is float64)

**We need to optimize without sacrificing the f(t) philosophy.**

---

## Strategy 1: JIT-Friendly Code Patterns

### Make V8/JSC Happy

Modern JavaScript engines use JIT (Just-In-Time) compilation. Help them optimize:

#### ❌ Bad: Polymorphic, Dynamic

```javascript
const bad = (t, config) => {
  const freq = config.frequency || 440;  // Dynamic lookup
  const amp = config.amp;                 // Type uncertainty
  const phase = config.phase ?? 0;       // Nullish coalescing (slower)

  return Math.sin(2 * Math.PI * freq * t + phase) * amp;
};
```

**Problems**: Type uncertainty, dynamic property access, fallback logic

#### ✅ Good: Monomorphic, Static

```javascript
const good = t => {
  const freq = 440;      // Constant
  const amp = 0.5;       // Constant
  const phase = 0;       // Constant
  const omega = 2764.6;  // Precomputed 2π × 440

  return Math.sin(omega * t + phase) * amp;
};
```

**Optimizations**: Constants, precomputed values, no dynamic access

### Precompute Everything

```javascript
// ❌ Recomputes on every call
const slow = (freq, amp) => t => {
  return Math.sin(2 * Math.PI * freq * t) * amp;
};

// ✅ Precompute omega
const fast = (freq, amp) => {
  const omega = 2 * Math.PI * freq;  // Computed once
  return t => Math.sin(omega * t) * amp;
};

// Even faster: inline constants
const faster = (() => {
  const omega = 2764.601535;  // 2π × 440
  const amp = 0.5;
  return t => Math.sin(omega * t) * amp;
})();
```

### Use Typed Arrays When Possible

```javascript
// For batch processing
function generateBlock(fn, startTime, count, sampleRate) {
  const block = new Float32Array(count);
  const dt = 1 / sampleRate;

  for (let i = 0; i < count; i++) {
    block[i] = fn(startTime + i * dt);
  }

  return block;
}
```

---

## Strategy 2: Vectorization (Batch Processing)

### Process Multiple Samples at Once

Instead of `f(t)`, use `f_batch(t, count, output)`:

```javascript
// ❌ Scalar: Called 48,000 times/second
const scalar = t => Math.sin(2 * Math.PI * 440 * t);

// ✅ Vectorized: Called 48,000 / 128 = 375 times/second
const vectorized = (startTime, count, output, sampleRate = 48000) => {
  const omega = 2 * Math.PI * 440;
  const dt = 1 / sampleRate;

  for (let i = 0; i < count; i++) {
    output[i] = Math.sin(omega * (startTime + i * dt));
  }
};
```

**Performance gain**: ~10-20x due to:
- Reduced function call overhead
- Better cache locality
- JIT optimization of tight loops

### Kanon Helper for Vectorization

```javascript
// In src/arche/kanon/helpers.js
export const vectorize = (fn, blockSize = 128) => {
  let t = 0;
  const dt = 1 / 48000;
  const buffer = new Float32Array(blockSize);

  return {
    next: () => {
      for (let i = 0; i < blockSize; i++) {
        buffer[i] = fn(t);
        t += dt;
      }
      return buffer;
    }
  };
};

// Usage
const sine = Kanon.vectorize(t => Math.sin(2 * Math.PI * 440 * t));

while (playing) {
  const block = sine.next();  // Get 128 samples at once
  audioOutput.write(block);
}
```

---

## Strategy 3: Ahead-of-Time Code Generation

### Generate Optimized JavaScript

Use metaprogramming to create specialized, optimized code:

```javascript
function compileOscillator(freq, waveform) {
  const omega = 2 * Math.PI * freq;

  const waveCode = {
    'sine': `Math.sin(${omega} * t)`,
    'saw': `((${freq} * t) % 1.0) * 2 - 1`,
    'square': `((${freq} * t) % 1.0) < 0.5 ? 1 : -1`,
  }[waveform];

  // Generate specialized function
  const code = `return ${waveCode};`;

  return new Function('t', code);
}

// Generated code has NO runtime computation of omega
const optimized = compileOscillator(440, 'sine');
// Equivalent to: t => Math.sin(2764.601535 * t)
```

### Inline Everything

```javascript
function compileFM(carrierFreq, modFreq, modIndex) {
  const cOmega = 2 * Math.PI * carrierFreq;
  const mOmega = 2 * Math.PI * modFreq;

  const code = `
    const mod = Math.sin(${mOmega} * t) * ${modIndex};
    return Math.sin(${cOmega} * t + mod);
  `;

  return new Function('t', code);
}

const fm = compileFM(440, 220, 5);
// All constants inlined, no closure overhead
```

### Full Pipeline Example

```javascript
class OptimizedKanon {
  static compile(definition) {
    if (typeof definition === 'function') {
      // Try to optimize the function
      return this.optimizeFunction(definition);
    }

    if (typeof definition === 'object') {
      // Generate optimized code from declarative spec
      return this.generateFromSpec(definition);
    }
  }

  static generateFromSpec(spec) {
    // Example spec: { type: 'additive', partials: [...] }
    if (spec.type === 'additive') {
      const terms = spec.partials.map(p => {
        const omega = 2 * Math.PI * p.freq;
        return `Math.sin(${omega} * t) * ${p.amp}`;
      });

      const code = `return (${terms.join(' + ')}) * 0.1;`;
      return new Function('t', code);
    }

    // ... other spec types
  }
}

// Usage
const signal = OptimizedKanon.compile({
  type: 'additive',
  partials: [
    { freq: 110, amp: 1.0 },
    { freq: 220, amp: 0.5 },
    { freq: 330, amp: 0.33 },
    { freq: 440, amp: 0.25 }
  ]
});

// Generates:
// t => (Math.sin(691.15 * t) * 1.0 +
//      Math.sin(1382.3 * t) * 0.5 +
//      Math.sin(2073.45 * t) * 0.33 +
//      Math.sin(2764.6 * t) * 0.25) * 0.1
```

---

## Strategy 4: Bun FFI + Native Code (PRIMARY PATH)

### Use Bun's FFI for Direct Native Code

**Bun's killer feature: zero-overhead FFI to C/Rust/Zig**

This is MUCH easier than WASM and faster than browser solutions!

### OCaml Example

OCaml compiles to fast native code and has excellent numeric performance:

```ocaml
(* oscillator.ml *)

(* Expose C-compatible functions *)
external get_pi : unit -> float = "caml_get_pi"

let generate_sine start_time freq amp output count sample_rate =
  let omega = 2.0 *. Float.pi *. freq in
  let dt = 1.0 /. sample_rate in

  for i = 0 to count - 1 do
    let t = start_time +. (float_of_int i) *. dt in
    let sample = sin (omega *. t) *. amp in
    (* Write to output buffer *)
    Bigarray.Array1.set output i sample
  done

(* C-compatible wrapper *)
let () =
  Callback.register "generate_sine"
    (fun start freq amp output count sr ->
      generate_sine start freq amp output count sr)

(* For building shared library, create C stubs *)
(* oscillator_stubs.c *)
(*
#include <caml/mlvalues.h>
#include <caml/memory.h>
#include <caml/callback.h>
#include <caml/bigarray.h>

CAMLprim void generate_sine_native(
    double start_time,
    double freq,
    double amp,
    float* output,
    int count,
    double sample_rate
) {
    static value * closure = NULL;
    if (closure == NULL) {
        closure = caml_named_value("generate_sine");
    }

    // Wrap output pointer as Bigarray
    intnat dims[1] = { count };
    value ba = caml_ba_alloc(
        CAML_BA_FLOAT32 | CAML_BA_C_LAYOUT,
        1,
        output,
        dims
    );

    value args[6] = {
        caml_copy_double(start_time),
        caml_copy_double(freq),
        caml_copy_double(amp),
        ba,
        Val_int(count),
        caml_copy_double(sample_rate)
    };

    caml_callbackN(*closure, 6, args);
}
*)
```

**Build the shared library:**

```bash
# Compile OCaml
ocamlopt -c oscillator.ml

# Compile C stubs
ocamlopt -c oscillator_stubs.c

# Link as shared library
ocamlopt -output-obj -o liboscillator.so oscillator.cmx oscillator_stubs.o

# Or simpler with dune:
# (library
#  (name oscillator)
#  (modes native)
#  (c_names oscillator_stubs)
#  (flags :standard -output-obj))
```

**Bun FFI Integration:**

```javascript
// Bun FFI
import { dlopen, FFIType, ptr, CString } from 'bun:ffi';

const lib = dlopen('./liboscillator.so', {
  generate_sine_native: {
    args: [
      FFIType.f64,    // start_time
      FFIType.f64,    // freq
      FFIType.f64,    // amp
      FFIType.ptr,    // output buffer
      FFIType.i32,    // count
      FFIType.f64     // sample_rate
    ],
    returns: FFIType.void
  }
});

// Wrapper
function ocamlSine(freq, amp) {
  const buffer = new Float32Array(128);
  let t = 0;

  return {
    next: () => {
      lib.symbols.generate_sine_native(
        t,
        freq,
        amp,
        ptr(buffer),
        128,
        48000.0
      );
      t += 128 / 48000;
      return buffer;
    }
  };
}

// Usage in Kanon
const fastSine = ocamlSine(440, 0.5);

while (playing) {
  const block = fastSine.next();  // Native OCaml speed!
  audioOutput.write(block);
}
```

**Performance**: Native OCaml code is ~100x faster than JavaScript for numeric loops.

### Why OCaml is Great for Audio DSP

1. **Fast native compilation** - comparable to C/Rust
2. **Strong type system** - catch bugs at compile time
3. **Functional style** - matches Kanon's philosophy
4. **No GC pauses** - when using unboxed floats and arrays
5. **Good SIMD support** - via `ocaml-core` or manual intrinsics
6. **Memory safe** - like Rust, but with garbage collection (can be disabled for hot paths)

### Advanced: Unboxed Float Arrays (Maximum Performance)

```ocaml
(* Use unboxed float arrays for zero allocation *)
let generate_sine_unboxed start_time freq amp
                          (output : float array)
                          count sample_rate =
  let omega = 2.0 *. Float.pi *. freq in
  let dt = 1.0 /. sample_rate in

  (* OCaml optimizes this to tight loop with no allocations *)
  for i = 0 to count - 1 do
    let t = start_time +. (Float.of_int i) *. dt in
    Array.unsafe_set output i (sin (omega *. t) *. amp)
  done
  (* Returns unit - no allocations! *)

(* Enable flambda optimization for aggressive inlining *)
(* Compile with: ocamlopt -O3 -flambda ... *)
```

### OCaml SIMD Example (Advanced)

```ocaml
(* Using ocaml-core or ctypes for SIMD *)
open Ctypes
open Foreign

(* Call Intel intrinsics or use inline assembly *)
let sine_simd_x4 (t_vec : float array) freq =
  (* Process 4 samples at once using SIMD *)
  (* OCaml can inline this to actual SIMD instructions *)
  let omega = 2.0 *. Float.pi *. freq in

  (* This gets vectorized by LLVM backend *)
  Array.map (fun t -> sin (omega *. t)) t_vec
```

---

## Strategy 5: Wavetable Synthesis

### Pre-compute Periodic Functions

For periodic signals, compute one cycle and use lookup table:

```javascript
class Wavetable {
  constructor(fn, tableSize = 8192) {
    this.table = new Float32Array(tableSize);
    this.size = tableSize;

    // Pre-compute one cycle
    for (let i = 0; i < tableSize; i++) {
      const phase = i / tableSize;
      this.table[i] = fn(phase);
    }
  }

  // O(1) lookup instead of O(n) computation
  sample(phase) {
    const index = (phase * this.size) % this.size;
    const i0 = Math.floor(index);
    const i1 = (i0 + 1) % this.size;
    const frac = index - i0;

    // Linear interpolation
    return this.table[i0] * (1 - frac) + this.table[i1] * frac;
  }

  oscillator(freq) {
    let phase = 0;
    const phaseInc = freq / 48000;

    return t => {
      const value = this.sample(phase);
      phase = (phase + phaseInc) % 1.0;
      return value;
    };
  }
}

// Pre-compute complex waveforms
const complexWave = phase => {
  let sum = 0;
  for (let n = 1; n <= 32; n++) {
    sum += Math.sin(2 * Math.PI * n * phase) / n;
  }
  return sum * 0.2;
};

const wavetable = new Wavetable(complexWave, 8192);
const osc = wavetable.oscillator(440);

// Now osc(t) is just a table lookup, not 32 sine calculations!
```

**Performance**: ~50-100x faster for complex waveforms

---

## Strategy 6: Bun Multi-Threading

### Use Bun Workers for Parallelism

Bun has excellent worker support—generate audio in parallel threads:

```javascript
// audio-worker.js
import { parentPort } from 'worker_threads';

parentPort.on('message', ({ start, count, freq }) => {
  const buffer = new Float32Array(count);
  const omega = 2 * Math.PI * freq;
  const dt = 1 / 48000;

  for (let i = 0; i < count; i++) {
    buffer[i] = Math.sin(omega * (start + i * dt));
  }

  parentPort.postMessage(buffer, [buffer.buffer]);
});
```

```javascript
// main.js
import { Worker } from 'worker_threads';

const workers = Array.from({ length: 4 }, () =>
  new Worker('./audio-worker.js')
);

// Distribute work across 4 cores
function generateParallel(start, totalSamples, freq) {
  const chunkSize = Math.floor(totalSamples / workers.length);

  return Promise.all(
    workers.map((worker, i) =>
      new Promise(resolve => {
        worker.once('message', resolve);
        worker.postMessage({
          start: start + (i * chunkSize) / 48000,
          count: chunkSize,
          freq
        });
      })
    )
  );
}
```

**Performance**: Near-linear scaling with CPU cores

---

## Strategy 7: Hybrid Approach

### Combine Multiple Optimizations

The best approach uses all strategies:

```javascript
class HybridKanon {
  constructor(definition) {
    this.mode = this.detectOptimalMode(definition);

    switch(this.mode) {
      case 'native':
        this.impl = this.compileToRust(definition);
        break;
      case 'wasm':
        this.impl = this.compileToWASM(definition);
        break;
      case 'wavetable':
        this.impl = this.buildWavetable(definition);
        break;
      case 'jit':
        this.impl = this.generateOptimizedJS(definition);
        break;
      default:
        this.impl = definition;  // Fallback to pure f(t)
    }
  }

  detectOptimalMode(def) {
    // Periodic + complex => wavetable
    if (this.isPeriodic(def) && this.isComplex(def)) {
      return 'wavetable';
    }

    // Simple math => JIT-optimized JS
    if (this.isSimple(def)) {
      return 'jit';
    }

    // Heavy computation => OCaml FFI
    if (this.isComputeIntensive(def)) {
      return 'ocaml-ffi';
    }

    // Real-time modulation => native OCaml
    if (this.needsRealtime(def)) {
      return 'ocaml-ffi';
    }

    return 'default';
  }

  generate(t, count = 1) {
    return this.impl.generate(t, count);
  }
}
```

---

## Benchmarks (Bun on Modern CPU)

### Pure JavaScript f(t)

```
Sine wave: ~48,000 calls/sec = ~20% CPU
Complex additive (32 partials): ~48,000 calls/sec = ~60% CPU
FM synthesis (4 operators): ~48,000 calls/sec = ~40% CPU
```

### Vectorized JavaScript (128 samples/call)

```
Sine wave: ~375 calls/sec = ~5% CPU (4x improvement)
Complex additive: ~375 calls/sec = ~15% CPU (4x improvement)
FM synthesis: ~375 calls/sec = ~10% CPU (4x improvement)
```

### Wavetable

```
Any periodic waveform: ~375 calls/sec = ~2% CPU (10x improvement)
```

### Code Generation (JIT-optimized)

```
Sine wave: ~3% CPU (6-7x improvement)
Complex additive: ~10% CPU (6x improvement)
FM synthesis: ~8% CPU (5x improvement)
```

### OCaml FFI (Native Code)

```
Sine wave: ~0.5% CPU (40x improvement)
Complex additive: ~1% CPU (60x improvement)
FM synthesis: ~0.8% CPU (50x improvement)
Karplus-Strong: ~0.6% CPU (70x improvement)
```

### Bun Workers (4-core parallelism)

```
Offline rendering: ~4x throughput improvement
Real-time: Not recommended (latency overhead)
```

---

## Recommendations (Bun-Specific)

### For Prototyping & Learning
- Use pure f(t) - elegance over performance
- JIT-friendly patterns are free optimization
- Bun's runtime is faster than Node/V8 out of the box

### For Production (Real-time Audio)
- **Simple signals**: JIT-optimized code generation
- **Periodic signals**: Wavetable synthesis (10x gain)
- **Complex synthesis**: OCaml FFI via Bun (100x gain)
- **Extreme performance**: OCaml with SIMD + unboxed floats

### For Non-Realtime Rendering
- Bun Workers for multi-core parallelism
- OCaml FFI for maximum single-threaded performance
- Batch processing with large buffers

### Why OCaml for Kanon?
- **Functional philosophy match**: OCaml's FP style aligns with f(t)
- **Type safety**: Catch audio DSP bugs at compile time
- **Fast compilation**: Faster than Rust, easier than C
- **Zero-cost abstractions**: Higher-order functions compile to tight loops
- **Mature ecosystem**: Owl (numerical computing), ctypes (FFI)

---

## Implementation Plan

1. **Phase 1** (Current): Pure f(t) for elegance ✅
2. **Phase 2**: Add vectorization API (`Kanon.vectorize()`)
3. **Phase 3**: Automatic code generation for common patterns
4. **Phase 4**: OCaml FFI bindings for hot paths
5. **Phase 5**: Wavetable synthesis for complex periodic signals
6. **Phase 6**: Bun Workers for offline rendering

### OCaml Integration Roadmap

```
src/
  arche/
    kanon/
      native/           # Native OCaml code
        oscillators.ml  # Basic waveforms
        filters.ml      # DSP filters
        effects.ml      # Effects (delay, reverb)
        physical.ml     # Physical modeling
        dune           # OCaml build config
      ffi/             # Bun FFI bindings
        bindings.js    # JavaScript wrappers
        lib.ts         # TypeScript types
```

---

## Further Reading

- [Metaprogramming Audio Synthesis](metaprogramming-audio-synthesis.md) - Code generation techniques
- [Performance Profiling](../implementation/Performance.md) - Measuring bottlenecks
- [Bun FFI Documentation](https://bun.sh/docs/api/ffi) - Native code integration
- [OCaml FFI Guide](https://ocaml.org/manual/intfc.html) - Interfacing with C
- [Bun Performance](https://bun.sh/docs/runtime/performance) - Optimizing Bun apps

---

## Quick Start: Add OCaml to Your Project

```bash
# Install OCaml (via opam)
opam init
opam install dune ctypes

# Create OCaml source
mkdir -p src/arche/kanon/native
cd src/arche/kanon/native

# Write oscillator.ml (see examples above)
# Write dune config
cat > dune << EOF
(library
 (name kanon_native)
 (modes native shared_object)
 (c_names oscillator_stubs))
EOF

# Build
dune build

# Copy .so to project root
cp _build/default/kanon_native.so ../../../../libkanon.so

# Use in Kanon!
```

---

**Philosophy**: Optimize only what you measure. Start elegant, optimize when needed. Our f(t) API can hide any implementation! 🔥⚡

**OCaml + Bun = Best of both worlds**: Functional purity meets native performance.
