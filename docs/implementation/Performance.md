[Home](../Home.md) > [Implementation](#) > Performance

# Performance Optimization Guide

> Making Wave professional performance-grade

## Current Status

Wave currently works well for live coding and basic synthesis. The architecture is clean and functional. However, there are optimization opportunities if you need:
- More simultaneous voices (currently ~10-20 is fine, 100+ would struggle)
- Complex per-sample DSP chains
- Minimal CPU usage for embedded/battery-powered devices
- Studio-grade audio quality with zero artifacts

**For typical live coding use: the current implementation is perfectly adequate.**

## Critical Performance Optimizations

### 1. Batch Processing Instead of Sample-by-Sample

**Current** (index.js:82-98):
```javascript
for (let i = 0; i < nframes; i++) {
  const t = currentTime + (i * dt);
  for (const fn of registry.values()) {
    const output = fn(t);  // Called nframes times!
    // ...
  }
}
```

**Problem**: Function call overhead dominates CPU time. For 512 samples × 10 voices = 5,120 function calls per buffer.

**Optimized - Batch Processing**:
```javascript
// Allow functions to process entire buffers at once
for (const fn of registry.values()) {
  fn.processBatch(bufferL, bufferR, nframes, currentTime, dt);
}
```

**Impact**: 10-50x faster (eliminate per-sample function call overhead)

---

### 2. Pre-allocate Time Buffer

Computing time values in the loop is wasteful.

```javascript
// At startup
const timeBuffer = new Float64Array(8192); // Max JACK buffer

// In fillBuffer()
for (let i = 0; i < nframes; i++) {
  timeBuffer[i] = currentTime + (i * dt);
}
// Now pass timeBuffer to wave functions
```

**Impact**: 5-10% faster, removes per-sample multiplication

---

### 3. SIMD Vectorization

Bun doesn't expose SIMD directly, but you can use WebAssembly SIMD for critical DSP operations:

```javascript
// Compile optimized DSP kernels in Rust/C
// - Mixing (summing multiple signals)
// - Oscillators (sine/saw/square generation)
// - Filters (biquad, one-pole)
// Load as WASM with SIMD support
```

**Impact**: 4-8x faster for math-heavy operations

---

### 4. Optimize Mixing Strategy

Current summing creates cache misses and redundant clamping.

**Better approach**:
```javascript
// Pre-allocate mix buffers
const mixL = new Float32Array(8192);
const mixR = new Float32Array(8192);

function fillBuffer(bufferL, bufferR, nframes) {
  mixL.fill(0, 0, nframes);
  mixR.fill(0, 0, nframes);

  // Each wave adds to mix buffer
  for (const fn of registry.values()) {
    fn.addToBuffer(mixL, mixR, nframes, currentTime, dt);
  }

  // Single pass for clipping + copy
  for (let i = 0; i < nframes; i++) {
    bufferL[i] = Math.max(-1, Math.min(1, mixL[i]));
    bufferR[i] = Math.max(-1, Math.min(1, mixR[i]));
  }
}
```

**Impact**: Better cache locality, 20-30% faster mixing

---

## DSP Quality Improvements

### 5. Band-Limited Oscillators

Current oscillators (wave-dsp.js:14-34) will alias at higher frequencies.

**Problem**: Naive square/saw waves contain infinite harmonics, causing audible aliasing above ~1kHz

**Solutions**:
- **PolyBLEP** for square/saw (eliminates aliasing, minimal CPU cost)
- **Wavetables** with interpolation for sine (faster than Math.sin)
- **Oversampling** for nonlinear effects (distortion, wavefolder)

**Resources**:
- [PolyBLEP article](https://www.martin-finke.de/articles/audio-plugins-018-polyblep-oscillator/)
- [Wavetable synthesis](https://thewolfsound.com/wavetable-synthesis/)

---

### 6. Better Clipping/Limiting

Soft clipping with `Math.max/min` isn't smooth and can still alias.

**Current**:
```javascript
leftSample = Math.max(-1, Math.min(1, leftSample));
```

**Better alternatives**:
- **Tanh saturation**: `Math.tanh(x * 1.5)` (smoother, musical)
- **Soft clip**: `x / (1 + Math.abs(x))` (cheap, effective)
- **Look-ahead limiter**: Analyzes upcoming samples to prevent peaks
- **DC blocker**: Remove DC offset that builds up from saturation

---

### 7. Anti-Aliasing Filters

High-frequency content above Nyquist (24kHz at 48kHz) causes aliasing.

**Add**:
- One-pole lowpass at 20kHz on output stage
- Oversampling (2x or 4x) for nonlinear processing (distortion, wavefolder)
- Proper decimation filtering when downsampling

---

## Architecture Improvements

### 8. Separate Audio Thread from User Code

**Current Risk**: User functions run in JACK's real-time thread. Memory allocation or slow code causes audio glitches.

**Better architecture**:
```
User Thread               Audio Thread
─────────────            ──────────────
Wave functions      →    Pre-rendered buffers
(can allocate)           (lock-free queue)

Hot reload          →    Swap buffers atomically
Register/remove     →    Wait-free update
```

**Implementation**:
- Use `SharedArrayBuffer` + `Atomics` for lock-free communication
- User code renders ahead into ring buffer
- Audio thread just copies from ring buffer (always safe)

**Trade-off**: Adds latency (buffer ahead by 2-4 buffers)

---

### 9. Compilation/JIT Hints

Help Bun's JavaScriptCore JIT optimize hot paths:

```javascript
// Force JIT optimization
function warmupJIT(fn, iterations = 10000) {
  for (let i = 0; i < iterations; i++) fn(i / 48000);
}

// After registering functions
kanon('sine', t => Math.sin(2 * Math.PI * 440 * t));
warmupJIT(registry.get('sine'));
```

**Impact**: Ensures functions are JIT-compiled before use, prevents stuttering

---

### 10. Buffer Size Configuration

Hardcoded 48kHz is limiting for pro audio scenarios.

**Add**:
```javascript
// Query JACK for actual settings
const actualSampleRate = jack.symbols.jack_get_sample_rate(client);
const bufferSize = jack.symbols.jack_get_buffer_size(client);

// Support 44.1kHz, 48kHz, 96kHz, 192kHz
// Support buffer sizes 64-8192 samples
```

**Benefit**: Compatibility with various hardware and pro audio setups

---

## Professional Features

### 11. CPU Usage Monitoring

Track real-time performance:

```javascript
let maxCPU = 0;
let avgCPU = 0;
let cpuSamples = 0;

function fillBuffer(bufferL, bufferR, nframes) {
  const start = performance.now();

  // ... processing ...

  const elapsed = performance.now() - start;
  const budgetMs = (nframes / SAMPLE_RATE) * 1000;
  const cpuUsage = (elapsed / budgetMs) * 100;

  maxCPU = Math.max(maxCPU, cpuUsage);
  avgCPU = (avgCPU * cpuSamples + cpuUsage) / (cpuSamples + 1);
  cpuSamples++;

  if (cpuUsage > 70) console.warn(`CPU: ${cpuUsage.toFixed(1)}%`);
}

// Expose stats
wave.stats = () => ({ maxCPU, avgCPU, samples: cpuSamples });
```

---

### 12. Underrun Detection (XRun Handling)

JACK signals xruns (buffer underruns) when processing takes too long.

**Add handler**:
```javascript
jack.symbols.jack_set_xrun_callback(client, callback((arg) => {
  console.error('⚠️  XRUN detected! Audio glitch occurred.');
  xrunCount++;
  return 0;
}), null);

// Expose count
wave.xruns = () => xrunCount;
```

**What XRuns mean**:
- CPU can't keep up with real-time deadline
- Indicates need for optimization or simpler synthesis

---

### 13. Graceful Error Recovery

Current error handling fills silence (jack-backend.js:115-122).

**Better approach**:
```javascript
let lastGoodBufferL = new Float32Array(8192);
let lastGoodBufferR = new Float32Array(8192);

try {
  fillBuffer(bufferL, bufferR, nframes);
  lastGoodBufferL.set(bufferL.subarray(0, nframes));
  lastGoodBufferR.set(bufferR.subarray(0, nframes));
} catch (error) {
  // Fade to silence instead of instant cutoff
  for (let i = 0; i < nframes; i++) {
    const fade = 1 - (i / nframes);
    bufferL[i] = lastGoodBufferL[i] * fade;
    bufferR[i] = lastGoodBufferR[i] * fade;
  }
  console.error('Audio callback error:', error);
}
```

**Benefit**: Smooth fade instead of sudden silence on errors

---

## Benchmarking & Profiling

### 14. Performance Test Suite

Create benchmark suite:

```javascript
// benchmark.js
const iterations = 100000;
const testBufferL = new Float32Array(512);
const testBufferR = new Float32Array(512);

// Benchmark fillBuffer
const start = performance.now();
for (let i = 0; i < iterations; i++) {
  fillBuffer(testBufferL, testBufferR, 512);
}
const elapsed = performance.now() - start;

const samplesPerSec = (iterations * 512) / (elapsed / 1000);
const realtimeMultiple = samplesPerSec / 48000;

console.log(`Throughput: ${realtimeMultiple.toFixed(1)}x realtime`);
console.log(`Can handle ${Math.floor(realtimeMultiple)} simultaneous streams`);
```

**Target**: 100x realtime or better (can process 100 streams simultaneously)

---

### 15. Profile with Bun's Built-in Tools

```bash
# CPU profiling
bun --inspect runner.js session.js
# Open chrome://inspect in Chrome
# Click "inspect" and go to Profiler tab

# Heap profiling
bun --inspect-brk runner.js session.js
# Take heap snapshots to find memory leaks
```

---

## Priority Implementation Order

### Phase 1 - Quick Wins (1-2 days)
1. ✅ Pre-allocate time buffer (#2)
2. ✅ Optimize mixing (#4)
3. ✅ CPU monitoring (#11)
4. ✅ Benchmark suite (#14)

**Expected**: 2-3x performance improvement

---

### Phase 2 - Core Optimization (1 week)
5. ✅ Batch processing API (#1) - **Biggest win**
6. ✅ Band-limited oscillators (#5)
7. ✅ Better limiting (#6)
8. ✅ XRun detection (#12)

**Expected**: 5-10x improvement + better audio quality

---

### Phase 3 - Pro Features (2 weeks)
9. ✅ Separate audio thread (#8)
10. ✅ SIMD/WASM kernels (#3)
11. ✅ Anti-aliasing (#7)
12. ✅ JIT warmup (#9)

**Expected**: 20-50x improvement, studio-grade quality

---

## Current Performance Estimates

Based on the architecture review:

| Scenario | Current Status | After Phase 1 | After Phase 2 | After Phase 3 |
|----------|---------------|---------------|---------------|---------------|
| Simple sine waves | ~20-30 voices | ~60-90 voices | ~200-300 voices | ~1000+ voices |
| Complex DSP chains | ~5-10 voices | ~15-30 voices | ~50-100 voices | ~200-500 voices |
| CPU usage (idle) | ~5-10% | ~2-5% | ~1-2% | ~0.5-1% |
| Audio quality | Good | Good | Excellent | Studio-grade |
| XRuns (glitches) | Rare | Very rare | Never | Never |

---

## When to Optimize

**Don't optimize if**:
- You're using <10 simultaneous voices
- CPU usage is comfortable (<30%)
- No audio glitches (XRuns)
- You're happy with the sound quality

**Do optimize if**:
- You need 50+ simultaneous voices
- CPU usage is high (>50%)
- Frequent audio glitches
- You hear aliasing/distortion in oscillators
- You want to release as a product

---

## Trade-offs

| Optimization | Pros | Cons |
|--------------|------|------|
| Batch processing | Massive speedup | More complex API |
| Separate audio thread | No glitches ever | Added latency, complexity |
| SIMD/WASM | Maximum performance | Build complexity, harder to debug |
| Band-limited oscillators | Better sound quality | Slightly higher CPU |
| JIT warmup | Consistent performance | Startup delay |

---

## Conclusion

Wave's current implementation is **good for live coding** but has room for optimization if you need professional-grade performance. The architecture is clean and the incremental optimization path is clear.

**Recommended approach**: Start with Phase 1 optimizations (easy wins), then only proceed to Phase 2/3 if you actually need the extra performance.

**Remember**: Premature optimization is the root of all evil. Optimize when you have concrete performance problems, not before.
