# Architecture Lesson 1: Push vs. Pull in Real-Time Audio

This document explains a fundamental issue we discovered and fixed in the `lel` audio engine: the difference between a "push" and a "pull" architecture and why the latter is essential for glitch-free, performant audio.

## The Problem: "Push" Architecture & Glitches

Our first attempt at building the audio engine used `setInterval` to generate audio. This is a **"push" architecture**. We are generating audio on a timer and pushing it to the audio hardware, hoping that we're doing it at the exact right time, which leads to timing conflicts and glitches.

## The Solution: A "Pull" Architecture with Streams

The correct solution is a **"pull" architecture"**, where the audio hardware *tells us* when it needs more data. We implemented this with a custom Node.js `Readable` stream that pipes into the `speaker` instance, solving the primary glitching issue.

---

# Architecture Lesson 2: High-Performance State & The Garbage Collector

After fixing the timing, a new, infrequent glitch appeared. This is a classic symptom of **Garbage Collection (GC)** pauses.

## The Problem: "Stop-the-World" Pauses

Using plain JavaScript objects for state (`s.state = { phase: 0 }`) creates "garbage" that the JavaScript engine must periodically clean up. This cleanup pauses our program for a few milliseconds, and if that pause happens when the audio hardware needs data, a **glitch** occurs.

## The Solution: Pre-Allocation and Zero Garbage

The solution is to **create zero garbage in the real-time audio loop**.

1.  **Single Memory Block:** We pre-allocate one large `Float64Array` called `STATE` on `globalThis` when the engine starts.
2.  **Persistent Offsets:** Each signal is assigned a permanent, unique slice of this `STATE` array for its state.
3.  **Direct Memory Access:** Signals read and write directly to their slice of the `Float64Array` (e.g., `s.state[0] = ...`). This is incredibly fast and creates no garbage.

---

# Architecture Lesson 3: The Decoupled Producer/Consumer Model

Our final architectural breakthrough was implementing a true producer/consumer model, which solves multiple problems and elevates the engine to a professional standard.

## The Problem: A "Tangled" Pipeline & Race Conditions

Initially, our `generateAudioChunk` function was responsible for both creating audio and feeding it to the speaker stream. This created race conditions on startup, where the speaker would ask for audio before any was generated, causing "Starvation" errors. Attempts to fix this with a complex, multi-stage "pre-fill" loop only introduced new bugs and hangs.

## The Solution: Full Decoupling and Concurrent Startup

The most robust and performant architecture is to **completely decouple** the audio generation (producer) from the audio output (consumer) and **start them concurrently**.

1.  **The Ring Buffer:** This is the central meeting point. It's a thread-safe, shared piece of memory that holds the audio data.

2.  **The Producer (`index.js`):**
    *   Runs in a high-speed `setImmediate` loop.
    *   Its **only job** is to generate audio as fast as possible and write it into the ring buffer.
    *   It will pause if the ring buffer is full, automatically balancing the system.

3.  **The Consumer (`transport.js`):**
    *   This is the `Readable` stream that feeds the speaker.
    *   Its **only job** is to read data *from* the ring buffer whenever the audio hardware is ready for it.

By starting both loops at the same time, we create a resilient system. The consumer might ask for data and find none for the first few milliseconds (which may log a harmless "Starvation" message), but the producer, running in a tight loop, will immediately catch up and fill the buffer. This eliminates all complex startup logic and creates a system that reliably balances itself.
