# The Universe State Object (`s`)

> *"Everything you need, in one place."*

## Overview

The universe state object `s` is the single parameter passed to every signal function in Aither. It is the heart of the `f(s)` paradigm. It contains all the context a signal needs to generate sound: time, sample rate, memory, and more.

Understanding the properties of `s` is the key to unlocking all five of Aither's synthesis paradigms.

```javascript
f(s) → sample
```

---

## Core Properties

These properties represent the fundamental dimensions of the Aither universe.

### `s.t`: Absolute Time

-   **Type:** `Number` (seconds)
-   **Description:** The absolute time in seconds since the audio engine started. This value increases continuously and smoothly.
-   **Primary Paradigm:** 🔥 **Kanon (Fire)**
-   **Use Cases:**
    -   Pure, stateless functions of time: `Math.sin(s.t * freq * 2 * Math.PI)`
    -   Driving LFOs and other time-based modulations.
    -   Creating envelopes and sequences based on absolute time.

### `s.state`: Local State Memory

-   **Type:** `Float64Array`
-   **Description:** The signal's private, persistent memory. Each signal registered with `play()` receives its own unique `state` array. This memory survives `play()` hot-swaps, ensuring phase continuity.
-   **Primary Paradigm:** 🌍 **Rhythmos (Earth)**
-   **Use Cases:**
    -   Storing oscillator phase for smooth, stateful oscillators.
    -   Storing filter history (e.g., the previous sample's output).
    -   Storing the current value of an envelope.
    -   Any value that needs to "remembered" from one sample to the next.

### `s.position`: Spatial Position

-   **Type:** `Object` (`{x, y, z}`)
-   **Description:** The global, shared position of the "listener" in 3D space. This is the same for all signals at any given moment.
-   **Primary Paradigm:** ✨ **Chora (Aither)**
-   **Use Cases:**
    -   Creating sounds whose timbre or amplitude changes based on the listener's location.
    -   Modeling spatial audio, distance attenuation, and virtual acoustic environments.

---

## Engine & Paradigm Context

These properties provide necessary context about the audio engine and are used by specific paradigms.

### `s.sr`: Sample Rate

-   **Type:** `Number` (Hz)
-   **Description:** The sample rate of the audio engine (e.g., `48000`). This is a shared, global value. It is passed in to make signal functions pure and portable.
-   **Primary Paradigms:** 🌍 **Rhythmos**, 💧 **Physis**
-   **Use Cases:**
    -   Calculating the phase increment for an oscillator: `phase += freq / s.sr`.
    -   Converting between seconds and samples.

### `s.dt`: Delta Time

-   **Type:** `Number` (seconds)
-   **Description:** The duration of a single sample (`1 / s.sr`). This is a pre-calculated convenience value.
-   **Primary Paradigms:** 💧 **Physis (Water)**, 💨 **Atomos (Air)**
-   **Use Cases:**
    -   Physics simulations that evolve step-by-step.
    -   Discrete, iterative processes like chaos algorithms.
    -   Anywhere "the time since the last sample" is the most natural unit to think in.

---

## Engineering & Advanced Properties

These properties are less about the musical paradigms and more about the practical engineering of the engine and advanced DSP techniques.

### `s.name`: Signal Identity

-   **Type:** `String`
-   **Description:** The unique name given to the signal in the `play(name, ...)` command.
-   **Use Case:** **Enabling Ergonomic DSP Helpers.**
-   **Explanation:** Stateful helpers (like filters, delays, etc.) need to store their own private memory. `s.name` is used by these helpers as a key to automatically find their own state within a shared memory pool, without requiring the user to manually manage state slots. It is a vital piece of plumbing that makes the `dsp.js` library clean and powerful.

### `s.idx`: Buffer Index

-   **Type:** `Number` (integer)
-   **Description:** The current sample's index within the audio buffer being processed by the hardware (e.g., an integer from `0` to `511`). This value resets on every new buffer.
-   **Use Case:** **Advanced, Buffer-Based Synthesis (Samplers, Granular, Looping).**
-   **Explanation:** While most paradigms rely on the continuous `s.t`, some advanced techniques require operating on blocks of memory. `s.idx` provides a direct, integer-based "write head" for these scenarios.
    
    For example, if you are building a live looper, you might record incoming audio into a buffer. `s.idx` provides a simple, efficient way to know where in your buffer to write the current sample, without needing to perform floating-point math on `s.t` for every sample.
    
    ```javascript
    // A simplified looper recorder example
    const my_buffer = new Float64Array(48000);
    
    play('recorder', s => {
      // s.idx gives us a perfect, integer-based write head
      // that is synchronized with the audio driver.
      my_buffer[s.idx % my_buffer.length] = live_input(s);
      return 0;
    });
    ```
    For most users, **`s.t` is the correct value to use for time.** You should only use `s.idx` if you are specifically designing a buffer-based process and understand that it resets on every audio block.
