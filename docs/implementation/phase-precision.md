# Architectural Pattern: Phase Accumulators for Precision

This document explains a critical best practice for digital audio synthesis: the use of wrapping phase accumulators to prevent floating-point precision loss and ensure long-term oscillator stability.

## The Problem: The Ever-Increasing Time Variable

A naive way to generate a sine wave is as a direct function of absolute time (`t`):

```javascript
// Naive approach (Kanon paradigm)
const frequency = 440;
return Math.sin(2 * Math.PI * frequency * s.t);
```

While mathematically pure, this pattern has a fatal flaw in a long-running audio engine: **floating-point precision loss.**

A standard `Float64` number (used by JavaScript) has about 15-17 decimal digits of precision. The `s.t` variable increases indefinitely. After a long enough time (minutes or hours), `s.t` becomes a very large number.

When the engine tries to add the very small time delta (`s.dt`, which is `1 / 48000`), the precision of the `Float64` is no longer sufficient to accurately represent the result.

```javascript
// Conceptually, after a long time:
const large_time = 80000.123456789012345;
const small_increment = 0.000020833333333;

// The result of this addition loses precision
let new_time = large_time + small_increment; 
// new_time might become 80000.12347762234... but the last few digits are inaccurate
```

This tiny inaccuracy, called "phase jitter," causes the oscillator's frequency to become unstable, resulting in audible artifacts like graininess, distortion, or subtle "pops." At its extreme, the increment becomes so small relative to the total time that it's rounded down to zero, and the oscillator freezes entirely.

## The Solution: The Wrapping Phase Accumulator

The professional and correct solution is to use a **wrapping phase accumulator**. This is the foundation of the **Rhythmos (Earth 🌍)** paradigm.

Instead of a time variable that grows forever, we use a `phase` variable that is always kept within the range of `0.0` to `1.0`.

```javascript
// Robust approach (Rhythmos paradigm)
const frequency = 440;

// 1. Calculate the phase increment once.
const phaseIncrement = frequency / s.sr;

// 2. Accumulate the phase in a persistent state variable.
s.state[0] = (s.state[0] || 0) + phaseIncrement;

// 3. Wrap the phase to keep it in the high-precision 0.0-1.0 range.
s.state[0] %= 1.0;

// 4. Generate the sine wave from the wrapped phase.
return Math.sin(s.state[0] * 2 * Math.PI);
```

### Why This Works

1.  **Maintains High Precision:** By keeping the `phase` variable between 0.0 and 1.0, we are always operating in the "sweet spot" of floating-point precision. The additions are always accurate.
2.  **Mathematically Correct:** For a periodic function like `sin`, the integer part of the phase is irrelevant. `sin(0.25)` is the same as `sin(1.25)` or `sin(100.25)`. By wrapping, we discard the irrelevant integer part and keep only the crucial fractional part.
3.  **Stateful and Continuous:** Storing the phase in `s.state` ensures that it persists across hot-reloads, providing perfect phase continuity when live-coding.

---

## Alternative Solution: High-Precision Timekeeping (Engine-Level)

To support the mathematical purity of the stateless `f(s.t)` style without precision loss, the engine itself can implement a high-precision timekeeper. This is a backend fix that makes the `Kanon` paradigm robust for all users transparently.

### The Technique: Double-Precision Time

Instead of using one large `Float64` for `s.t`, the engine internally tracks two: one for the integer seconds and one for the fractional seconds.

```javascript
// Inside server.js
let time_sec = 0;      // The whole number of seconds
let time_frac = 0.0;   // The fractional part

// On every sample...
time_frac += s.dt;
if (time_frac >= 1.0) {
    time_sec++;
    time_frac -= 1.0;
}

// Reconstruct s.t with full precision for the user
s.t = time_sec + time_frac;
```

### Why This Works

All the incremental additions (`+= s.dt`) happen on the `time_frac` variable, which always stays between 0.0 and 1.0. This avoids the catastrophic precision loss of adding a tiny number to a very large number. The user-facing `s.t` is reconstructed "just-in-time" on every sample, providing a perfectly stable and precise absolute time value.

## Conclusion and Best Practice

*   For **pitched oscillators** where phase-continuity during live-coding is paramount, the **Rhythmos** `s.state` accumulator is the recommended best practice. It gives the user explicit control.
*   The **engine's high-precision timekeeper** ensures that the **Kanon** `s.t` style is also perfectly stable and can be used freely for mathematical exploration, modulation, and writing simple, elegant signals without fear of long-term degradation.

Both approaches are valid and supported, embodying the engine's philosophy of expressive flexibility.
