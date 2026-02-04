# Architectural Refactor: Worker-Based Audio Engine

This document outlines the proposal to refactor the Flux audio engine to use a dedicated Bun worker thread for audio synthesis.

## Current Architecture

The current architecture runs all processes on the main thread:
1. **Audio Synthesis:** A `setImmediate` loop in `engine.js` continuously calls `updateAll()` to generate audio samples and fill a ring buffer.
2. **Hot-Reloading:** The `bun --hot` command watches for file changes (`signals.js`) and manages the module reloading process.

This creates a resource conflict. The main thread is responsible for both real-time audio generation and file I/O, which can lead to audio glitches (clicks, stutters) when a hot-reload is triggered.

## Proposed Architecture

I propose moving the entire audio synthesis loop to a dedicated Bun worker thread.

```
Main Thread                                     Worker Thread
┌───────────────────────────────────────────┐   ┌───────────────────────────────────┐
│ index.js - Entry Point & Control          │   │                                   │
├───────────────────────────────────────────┤   │ worker.js - Audio Loop            │
│ engine.js - Worker Management             │   │ ┌─────────────────────────────┐   │
│   - Spawns worker                         │   │ │ while(true) {               │   │
│   - Sends start/stop commands             │◀──MSG──▶│   updateAll()               │   │
├───────────────────────────────────────────┤   │ │   ringBuffer.write()        │   │
│                                           │   │ │ }                           │   │
│ signals.js - Live Coding (Hot-Reloaded)  │   │ └─────────────────────────────┘   │
└───────────────────────────────────────────┘   └───────────────────────────────────┘
            │                                                   │
            ▼                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ Shared Memory (SharedArrayBuffer)                                             │
│   - FLUX_STATE (Signal state)                                                 │
│   - Ring Buffer (Audio samples)                                               │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Key Changes:

1. **`worker.js` (New File):** This file will contain the high-priority, uninterrupted audio generation loop (`fillBuffer`). It will read from the shared `FLUX_STATE` and write to the shared ring buffer.
2. **`engine.js` (Refactored):** This file will no longer contain the `fillBuffer` loop. Instead, it will be responsible for:
   * Spawning the `worker.js` thread.
   * Sending control messages (e.g., `start`, `stop`) to the worker.
3. **Shared State:** Both the `ringBuffer` and the `FLUX_STATE` will be backed by `SharedArrayBuffer` instances to allow for zero-copy access from both the main thread and the worker thread.

## Rationale & Benefits

This change is critical for the stability and scalability of Flux.

1. **Audio Stability:** By isolating the audio loop in a dedicated thread, it is completely insulated from the main thread's responsibilities (file I/O, hot-reloading). This will eliminate audio glitches during live-coding sessions, fulfilling the project's core promise of seamless sound surgery.
2. **Responsiveness:** The main thread becomes lightweight, dedicated only to user interaction and control. This will make the application, particularly the hot-reload cycle, feel faster and more reliable.
3. **Future-Proofing:** This architecture provides a robust foundation for planned features like a 3D oscilloscope or Vim integration. These features can be added to the main thread without risking the integrity of the real-time audio core.

In summary, this refactor is a foundational improvement that directly enhances the core user experience and makes the entire system more robust for future development.
