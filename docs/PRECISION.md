# The Importance of 64-bit Precision for Audio State

## The Question

In our `lel` engine, we use a 64-bit float (`Float64Array`) for our persistent state (`s.state`) but a 32-bit float (`Float32Array`) for our final audio output (`outputBuffer`).

On the surface, this seems inefficient. Why use twice the memory for state if the final output is only 32-bit?

The answer is to **guarantee the long-term mathematical stability of our oscillators and filters.**

## The Problem: The Limits of Floating-Point Numbers

A floating-point number can only store a certain number of significant digits.

-   **`Float32`**: Has ~7-8 decimal digits of precision.
-   **`Float64`**: Has ~15-17 decimal digits of precision.

An oscillator's phase is a **long-running accumulator**. In our code, it looks like this:

```javascript
// The phase value grows indefinitely before the modulo.
s.state[0] = (s.state[0] + (frequency / sampleRate));
```

The problem occurs when a very large number is added to a very small number.

### The Odometer Analogy

Imagine a car's odometer:
-   A **32-bit float** is like an old 7-digit odometer (`123,456.7` miles).
-   A **64-bit float** is like a modern 16-digit odometer (`123,456.7890123456` miles).

The `s.state[0]` value is the total mileage. The tiny `frequency / sampleRate` increment is like adding **one inch** to the total.

-   **At the start of the trip:** Both odometers can easily track `0.0 + 1 inch`.
-   **After a very long drive:** The 7-digit odometer might read `999,999.9` miles. If you try to add one more inch, the odometer **lacks the digits to register the change.** The inch is effectively lost in rounding. The odometer is "stuck."
-   The 16-digit odometer has no trouble and continues to track the change perfectly.

### The Technical Result

When using a `Float32` for a high-frequency oscillator's phase, after a few minutes or hours of the engine running, the accumulated phase value becomes so large that the small phase increment is smaller than the precision limit of the float.

The addition `large_phase + small_increment` effectively results in `large_phase`.

The oscillator stops accumulating phase. It gets stuck, producing either silence (a DC offset) or a very grainy, incorrect tone. This is a catastrophic failure for a synthesis engine that is expected to run for long periods.

## The Solution: Hybrid Precision

Our approach is the professional standard for high-performance audio synthesis:

1.  **Use `Float64` for State (`s.state`):** We use 64-bit precision where it is critically needed—in the long-running accumulators for phase, filter state, and other parameters. This guarantees that our synthesis algorithms will remain mathematically correct and stable indefinitely.

2.  **Use `Float32` for Output (`outputBuffer`):** The final audio sample sent to the hardware is always in a small range (e.g., -1.0 to 1.0). A 32-bit float has more than enough precision to represent these values with a quality that is indistinguishable from 64-bit to the human ear. This is the industry standard for high-quality audio and is more memory-efficient for the final buffer.

By using this hybrid model, we get the best of both worlds: the scientific-grade precision required for stable synthesis and the memory-efficient standard required for audio output.
