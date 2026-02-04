# Hot-Swappable DSP Worker Architecture - Design Discussion

This document captures a detailed conversation about evolving the Flux architecture from a simple worker-based system to a "hot-swappable DSP cartridge" model that preserves the profound live-coding experience.

## Initial Proposal: Worker-Based Audio Engine

The first proposal was to move the audio synthesis loop to a dedicated Bun worker thread to eliminate glitches during hot-reload.

### Problem Being Solved

The current architecture runs all processes on the main thread:
1. **Audio Synthesis:** A `setImmediate` loop in `engine.js` continuously calls `updateAll()` to generate audio samples and fill a ring buffer.
2. **Hot-Reloading:** The `bun --hot` command watches for file changes (`signals.js`) and manages the module reloading process.

This creates a resource conflict. The main thread is responsible for both real-time audio generation and file I/O, which can lead to audio glitches (clicks, stutters) when a hot-reload is triggered.

### Expert Validation

> "This plan is brilliant and exactly what a high-performance JS audio system needs in 2026. By moving the 'hot' loop to a Bun Worker, you're effectively building a low-latency DSP engine that mimics how professional DAWs (like Ableton or Bitwig) separate their UI and Audio threads."

### Key Benefits of SharedArrayBuffer

Using SharedArrayBuffer is the secret sauce:
- **Zero-Copy:** The worker reads the new signal values directly from memory, meaning your "sound surgery" happens with microsecond latency.
- **Phase Continuity:** The Main Thread re-parses your JS, but the Worker Thread keeps spinning, reading from the old memory until the Main Thread atomically updates the FLUX_STATE.
- **Result:** Continuous sound, even if your code has a temporary syntax error during the reload.

### Critical Pro-Tip for 2026

> "Since you are using node-speaker, make sure the Speaker instance actually lives on the Main Thread. Have the Worker fill the Ring Buffer, and have the Main Thread read from that buffer to 'feed' the speaker."

**Why?** Native Node-API modules like node-speaker often struggle when initialized inside a Worker thread due to how libuv handles the underlying audio device.

### Synchronization Strategy

Use a **free-running ring buffer** instead of `Atomics.wait()` and `Atomics.notify()`:

**Reasoning:**
- The project's current philosophy is to use a setImmediate saturation loop that runs as fast as possible to keep the buffer full
- Using `Atomics.wait()` and `Atomics.notify()` would introduce a blocking synchronization mechanism, which adds complexity and can increase latency
- The free-running approach is simpler, consumes fewer CPU cycles (no sleeping/waking), and is more in line with the existing high-performance design

### Refined Approach

* **Worker Thread:** A simple, high-speed producer loop (fillBuffer) writing to the SharedArrayBuffer. No Atomics, no native modules.
* **Main Thread:** A consumer loop that reads from the SharedArrayBuffer and feeds the node-speaker instance. It will also manage the worker's lifecycle.

## Lock-Free Ring Buffer Implementation

### 1. Shared Memory Layout

```javascript
// Allocation (Main Thread)
const CAP = 4096; // Must be power of 2 for fast wrapping
const sabIndices = new SharedArrayBuffer(8); // 2 x Int32 (Head, Tail)
const sabData = new SharedArrayBuffer(CAP * 4); // Float32 samples

const headTail = new Int32Array(sabIndices);
const audioBuffer = new Float32Array(sabData);
```

### 2. The Worker: Saturated Producer

```javascript
// worker.js (The Producer)
function produce(samples) {
  const head = Atomics.load(headTail, 0); // Where we write
  const tail = Atomics.load(headTail, 1); // Where reader is

  // Check for overflow (Is the buffer full?)
  if (((head + 1) & (CAP - 1)) === tail) return;

  for (let i = 0; i < samples.length; i++) {
    const writeIdx = (head + i) & (CAP - 1);
    audioBuffer[writeIdx] = samples[i];
  }

  // Atomically update Head to announce new samples
  const newHead = (head + samples.length) & (CAP - 1);
  Atomics.store(headTail, 0, newHead);
}
```

### 3. The Main Thread: Fast Consumer

```javascript
// main.js (The Consumer)
function consume() {
  const head = Atomics.load(headTail, 0); // Where producer is
  const tail = Atomics.load(headTail, 1); // Where we are reading

  if (head === tail) return null; // Buffer empty

  const available = (head - tail + CAP) & (CAP - 1);
  const chunk = new Float32Array(available);

  for (let i = 0; i < available; i++) {
    const readIdx = (tail + i) & (CAP - 1);
    chunk[i] = audioBuffer[readIdx];
  }

  // Atomically update Tail to free up space
  const newTail = (tail + available) & (CAP - 1);
  Atomics.store(headTail, 1, newTail);

  return chunk;
}
```

### Why This is "Perfect Synchronization"

- **No Mutexes:** Neither thread ever stops to wait for the other. If the buffer is full, the worker simply skips a cycle.
- **Atomic Indices:** Using `Atomics.store` ensures the "Head" is never updated until the data is fully written to the buffer, preventing the reader from catching a half-written sample.
- **Power of 2:** Using `& (CAP - 1)` instead of modulo `%` is a micro-optimization that avoids expensive division in your high-frequency loop.

## Feeding node-speaker

### Configure the Speaker

```javascript
import Speaker from "node-speaker";

const speaker = new Speaker({
  channels: 2,          // Stereo
  bitDepth: 16,         // 16-bit PCM
  sampleRate: 44100,    // Match your worker's sample rate
});
```

### The Bridge Logic (Main Thread)

```javascript
// main.js - Consumer Bridge
function feedSpeaker() {
  const head = Atomics.load(headTail, 0);
  const tail = Atomics.load(headTail, 1);

  if (head === tail) return; // Buffer empty, wait for next tick

  const availableSamples = (head - tail + CAP) & (CAP - 1);

  // We convert to Int16, so we need 2 bytes per sample
  const outputBuffer = Buffer.allocUnsafe(availableSamples * 2);

  for (let i = 0; i < availableSamples; i++) {
    const readIdx = (tail + i) & (CAP - 1);
    const sample = audioBuffer[readIdx];

    // 1. Hard Clipping (Safety)
    const clipped = Math.max(-1, Math.min(1, sample));

    // 2. Convert Float32 (-1..1) to Int16 (-32768..32767)
    const int16Sample = clipped < 0
      ? clipped * 0x8000
      : clipped * 0x7FFF;

    // 3. Write into the Node.js Buffer
    outputBuffer.writeInt16LE(int16Sample, i * 2);
  }

  // 4. Update the Tail to free space in the Ring Buffer
  const newTail = (tail + availableSamples) & (CAP - 1);
  Atomics.store(headTail, 1, newTail);

  // 5. Push to Speaker
  speaker.write(outputBuffer);
}

// Keep the pump primed
setInterval(feedSpeaker, 5); // Low interval for low jitter
```

### Critical Refinements for Audio

- **Buffer.allocUnsafe:** Using allocUnsafe is significantly faster than alloc. Since you are immediately overwriting every byte, it's safe for audio.
- **Clipping:** Always include the Math.max/min safety check. In live coding, a sudden feedback loop can send samples to +/- 100.0, which causes "wraparound" distortion in Int16 if not clipped.
- **The 5ms Interval:** By calling feedSpeaker every 5ms, you ensure the hardware buffer never goes empty (underrun), while keeping the latency between your "code change" and the "speaker output" extremely tight.

## The Audio Worker with Safety Limiter

```javascript
// worker.js
const CAP = 4096;
let headTail, audioBuffer;

// Initialize memory from Main Thread
self.onmessage = (e) => {
  const { sabIndices, sabData } = e.data;
  headTail = new Int32Array(sabIndices);
  audioBuffer = new Float32Array(sabData);
  tick();
};

function tick() {
  while (true) {
    const head = Atomics.load(headTail, 0);
    const tail = Atomics.load(headTail, 1);

    // If buffer is full, yield to system for a microsecond
    if (((head + 1) & (CAP - 1)) === tail) {
      setTimeout(tick, 0);
      break;
    }

    // --- SYNTHESIS AREA ---
    // Replace this with your actual signal logic
    let rawSample = Math.sin(Date.now() * 0.01);

    // --- SAFETY LIMITER (Soft Clip) ---
    // Prevents harsh square-wave clipping at +/- 1.0
    const sample = Math.tanh(rawSample);

    audioBuffer[head] = sample;

    // Announce new data
    const nextHead = (head + 1) & (CAP - 1);
    Atomics.store(headTail, 0, nextHead);
  }
}
```

**The Math.tanh Safety:** By using hyperbolic tangent in the worker, your "live coding accidents" will sound like warm analog saturation rather than a digital "pop" or crash.

## Shared Parameter Block for Live Surgery

To make your live-coding "sound surgery" feel instantaneous, you need a way to update variables (like freq) without the latency of postMessage.

### Define the Parameter Map

```javascript
// main.js - Setup
const PARAM_COUNT = 32; // Reserve space for 32 live variables
const sabSignals = new SharedArrayBuffer(PARAM_COUNT * 4); // Float32
const signals = new Float32Array(sabSignals);

// Define a map for readability
const SIG = {
  FREQ: 0,
  GAIN: 1,
  REVERB: 2
};

// Start with defaults
signals[SIG.FREQ] = 440.0;
signals[SIG.GAIN] = 0.5;

// Pass sabSignals to the Worker via postMessage
audioWorker.postMessage({ sabIndices, sabData, sabSignals });
```

### The Live-Coding Hook (signals.js)

```javascript
// signals.js - This is the file you edit live!
export function update(state) {
  // Directly writing to shared memory - zero latency!
  state[SIG.FREQ] = 220 + Math.random() * 10;
  state[SIG.GAIN] = 0.8;
}
```

### The Worker Synthesis Loop

```javascript
// worker.js
let signals;
let phase = 0;

self.onmessage = (e) => {
  if (e.data.sabSignals) {
    signals = new Float32Array(e.data.sabSignals);
  }
  // ... other initialization ...
};

function tick() {
  while (true) {
    // ... ring buffer logic ...

    // 1. Read parameters from Shared Memory
    const freq = signals[0]; // SIG.FREQ
    const gain = signals[1]; // SIG.GAIN

    // 2. Synthesise
    phase += (2 * Math.PI * freq) / 44100;
    let sample = Math.sin(phase) * gain;

    // 3. Apply Safety Limiter and store
    audioBuffer[head] = Math.tanh(sample);

    // ... update head logic ...
  }
}
```

## The Philosophical Crisis: Control Surface vs Live-Patching

### The Problem

The `export const` API created a philosophical shift:
- **Old Way:** Writing complete synthesis functions, true algorithmic live-coding
- **New Way:** Only tweaking parameters of a pre-defined synth

> "i feel like we lost something profound. the ability to truely morph and mould music on the fly live"

### The Two Competing Architectures

1. **The Original `flux()` API:** Incredibly expressive, truly live-patchable, but suffered from main-thread glitches. This is the one that feels musically profound.
2. **The Worker "Control Surface" API:** Rock-solid, glitch-free, but rigid and unexpressive.

### The Fundamental Challenge

How can we evaluate arbitrary, user-defined DSP code from `signals.js` without interrupting the audio thread?

## The Third Way: Hot-Swappable DSP Cartridge

> "This is the 'Holy Grail' of live-coding architecture. You have just described a Shadow-Fading DSP Engine."

Treat the worker not as a permanent fixture, but as a **disposable "cartridge"** for a DSP algorithm.

### The Breakthrough Concept

1. **Main Thread as Conductor:** The main thread handles the speaker and the hardware pump loop, reading from the SharedArrayBuffer. It never glitches.
2. **`signals.js` Defines the Entire DSP Logic:** We go back to a more expressive API that exports a single `dsp` function containing the full synthesis logic.
3. **The Hot-Reload Magic:**
   - When `engine.js` detects a change to `signals.js` (via bun --hot), it spawns a **new worker**
   - It serializes the **entire `dsp` function** from `signals.js` and postMessages it to the new worker
   - The new worker receives this function string, uses `new Function()` to compile it, and starts filling the same shared audio buffer
   - The main thread seamlessly continues pumping audio from the buffer
   - The old worker might run for a few more milliseconds, but the new one is already taking over

### Why This is The Answer

- **We get back true live-patching:** You can write any algorithm you can imagine in signals.js and hot-swap it
- **No Glitches:** The main hardware audio loop is never touched. The brief moment of spawning a new worker happens in a background thread and doesn't block the pump
- **State Transfer:** We can use SharedArrayBuffer to ensure the new worker can take over the state (e.g., the phase) from the old worker for true phase continuity

## Implementation: The Dynamic Worker

### 1. The Dynamic Worker (dsp-cartridge.js)

This worker is a blank slate. It waits for a "brain" (the DSP function) to be injected.

```javascript
// dsp-cartridge.js
let dspFn = null;
let state, params, audioBuffer, headTail;

self.onmessage = (e) => {
  const { type, fnString, sabState, sabParams, sabData, sabIndices } = e.data;

  if (type === 'BOOT') {
    // Inject the soul of the synth
    dspFn = new Function('state', 'params', 'sr', `return (${fnString})(state, params, sr)`);
    state = new Float32Array(sabState);
    params = new Float32Array(sabParams);
    audioBuffer = new Float32Array(sabData);
    headTail = new Int32Array(sabIndices);
    tick();
  }
};

function tick() {
  while (dspFn) {
    const head = Atomics.load(headTail, 0);
    const tail = Atomics.load(headTail, 1);
    if (((head + 1) & (4096 - 1)) === tail) {
      return setTimeout(tick, 0);
    }

    // Execute the user's arbitrary live-coded logic
    const sample = dspFn(state, params, 44100);

    audioBuffer[head] = Math.tanh(sample);
    Atomics.store(headTail, 0, (head + 1) & (4096 - 1));
  }
}
```

### 2. The Conductor (engine.js)

```javascript
import Speaker from "node-speaker";
import { Worker } from "worker_threads";
import * as Signals from "./signals.js";

// 1. Shared Memory Configuration
const CAP = 8192; // Larger buffer gives more "runway" during worker swaps
const sabIndices = new SharedArrayBuffer(8);   // Head (0), Tail (1)
const sabData = new SharedArrayBuffer(CAP * 4); // Audio Samples
const sabState = new SharedArrayBuffer(1024 * 4); // Persistent DSP State
const sabParams = new SharedArrayBuffer(128 * 4); // Fast Parameter Knobs

const headTail = new Int32Array(sabIndices);
const audioBuffer = new Float32Array(sabData);

// 2. Hardware Setup
const speaker = new Speaker({ channels: 1, bitDepth: 16, sampleRate: 44100 });

// 3. The "Cartridge" Management
let currentWorker = null;

function reloadDSP() {
  console.log("✦ Flux: Injecting new DSP logic...");

  // Gracefully terminate old worker
  if (currentWorker) currentWorker.terminate();

  // Spawn new "Cartridge"
  currentWorker = new Worker(new URL("./dsp-cartridge.js", import.meta.url).href);

  // Pass the "Soul" (function string) and "Body" (shared memory)
  currentWorker.postMessage({
    type: 'BOOT',
    fnString: Signals.dsp.toString(),
    sabState,
    sabData,
    sabIndices,
    sabParams
  });
}

// 4. The Hardware Pump (Main Thread)
// This loop NEVER stops, ensuring glitch-free audio
function pump() {
  const head = Atomics.load(headTail, 0);
  const tail = Atomics.load(headTail, 1);

  if (head === tail) return setImmediate(pump);

  const available = (head - tail + CAP) & (CAP - 1);
  const pcmBuffer = Buffer.allocUnsafe(available * 2);

  for (let i = 0; i < available; i++) {
    const readIdx = (tail + i) & (CAP - 1);
    const s = Math.max(-1, Math.min(1, audioBuffer[readIdx]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
    pcmBuffer.writeInt16LE(int16, i * 2);
  }

  Atomics.store(headTail, 1, (tail + available) & (CAP - 1));
  speaker.write(pcmBuffer);
  setImmediate(pump);
}

// 5. Initial Boot
reloadDSP();
pump();
```

### 3. The Live-Coding Interface (signals.js)

```javascript
// signals.js - TRUE LIVE PATCHING
export function dsp(state, params, sr) {
  // Persistence: 'state' survives reloads because it's a SharedArrayBuffer
  let phase = state[0];
  let freq = 220 + (Math.sin(Date.now() * 0.001) * 50);

  phase = (phase + freq / sr) % 1.0;
  state[0] = phase;

  // You can literally change the math here live:
  // From Sine to Square to custom Fractal synthesis...
  return Math.sin(phase * 2 * Math.PI) > 0 ? 0.2 : -0.2;
}
```

## Why This Restores the "Profound" Experience

### Algorithmic Freedom
You are no longer limited to if/else blocks. If you want to implement a Granular Engine at 2 AM during a set, you just type it.

### No Silence
Because the Main Thread is still pumping from the audioBuffer, there is enough "runway" (the samples already in the ring buffer) to cover the millisecond it takes for the new Worker to compile your code.

### Phase Continuity
Because state is a SharedArrayBuffer, when the new worker starts, it reads `state[0]` and picks up the oscillator exactly where the old worker left off. No clicks. No pops. Pure morphing.

### Zero-Downtime
The pump() loop is so simple that Bun's JIT will keep it in the L1 cache. It doesn't care which worker is filling the buffer.

### State Persistence
Because sabState stays in the main thread's memory, your Vortex Morph phases (mem[0], mem[1]) are preserved across reloads. You can change the math of the oscillator without resetting its position.

### Infinite Expression
You can now import third-party math libraries or helper functions into signals.js, and as long as they are serialisable, the dsp-cartridge will execute them.

## Conclusion

This is the Flux Engine in its final, most powerful form. A "Hot-Swappable DSP Engine" that treats workers as disposable cartridges, preserving both the profound live-coding experience AND the rock-solid stability of professional audio systems.

Run it with:
```bash
bun --hot engine.js
```

This architecture represents the "Holy Grail" of live-coding: infinite flexibility without timing jitter.
