# Aither (αἰθήρ)

> *"One interface. Five paradigms. Infinite expression."*

**Aither** is a minimalist and powerful live coding environment for audio synthesis. It is designed from the ground up for improvisation and performance, treating your code editor as a true musical instrument.

At its heart is a single, elegant concept: the entire musical universe is expressed as a function of `s`, the state of the world.

`f(s) → sample`

---

## The Aither Difference: A New Philosophy

Aither is not just another synthesis library. It represents a different way of thinking about sound, inspired by the spirit of modular synthesis but supercharged by the power of modern software.

### Everything is an Audio Signal

In Aither, the distinction between "control signals" and "audio signals" is erased. A "clock" is just a low-frequency square wave. An "envelope" or "trigger" is just a fast, percussive audio signal. You create complex sounds and rhythms by composing these signals together through fundamental DSP operations like amplitude modulation.

### Functional Composition vs. Dataflow

Traditional environments (like SuperCollider or Max/MSP) use a **Dataflow** paradigm. Aither uses **Functional Composition**. You define your musical ideas as stateless "blueprints" (pure functions) and compose them together. This process creates a **single, new `f(s)` function** which is then sent to the engine, making it ideal for optimization by modern JIT compilers.

> **[Read the full Aither Philosophy](docs/PHILOSOPHY.md)**

---

## The Five Synthesis Paradigms

The five paradigms are not separate APIs; they are expressive **styles of thinking** that emerge naturally from the `f(s)` interface.

| Paradigm | Element | Uses | Style |
|----------|---------|------|-------|
| **Kanon** | Fire 🔥 | `s.t` | Pure, stateless functions of time |
| **Rhythmos** | Earth 🌍 | `s.state` | Stateful, continuous processes |
| **Atomos** | Air 💨 | `s.state`, `s.dt` | Discrete, emergent textures |
| **Physis** | Water 💧 | `s.dt` | Physics simulation |
| **Chora** | Aither ✨ | `s.position` | Spatial, holistic fields |

---

## Quick Start

```bash
# Install dependencies
bun install

# Link globally (one-time)
bun link

# Start the server
aither start

# In another terminal, send a file to the running engine
aither send my-session.js
```

## Examples

### Rhythmos: A Simple Oscillator

```javascript
// A stateful, phase-continuous oscillator.
play('osc', s => {
  s.state[0] = (s.state[0] + 440 / s.sr) % 1.0;
  return Math.sin(s.state[0] * 2 * Math.PI) * 0.3;
});
```

### Rhythm: The "Pure Audio" Kick Drum

This example demonstrates the core Aither philosophy: rhythm is created by treating all signals—even triggers and envelopes—as audio.

```javascript
// A 130 BPM kick drum.
play('kick', s => {
  // 1. The "Clock" is just a square wave LFO at 130 BPM.
  const pulse = square(130 / 60, s);
  
  // 2. The "Trigger" is a very fast audio-rate envelope
  //    generated from the rising edge of the clock's pulse.
  const trigger_envelope = envelope(pulse, 0.001, 0.05, s);
  
  // 3. The "Sound" is a simple sine wave oscillator.
  const kick_oscillator = sin(100, s);
  
  // 4. The final sound is created by multiplying the two audio signals.
  //    This is Amplitude Modulation, a fundamental DSP concept.
  return kick_oscillator * trigger_envelope;
});
```

---

## Core Rhythmic Concepts

The following examples use a few core concepts built from signals.

-   **Pulse:** A low-frequency square wave, like `square(2, s)`. It alternates between `+1` and `-1` and acts as a master clock or metronome.
-   **Gate:** A signal that is either `1` (on) or `0` (off) for a duration. It's used to "hold a note." You can create a gate by transforming a pulse: `(pulse + 1) / 2`.
-   **Envelope:** A signal that describes the shape of a sound's amplitude over time. *In Aither, the envelope itself is an audible signal that we use as a trigger.*
-   **Phasor:** A signal that ramps from `0` to `1` in sync with a pulse. It tells you *where you are* within a beat or measure and is the key to creating sequences and arpeggios.

> **A Note on Triggers:** While you can use a helper like `on_rising_edge(pulse)` to create an abstract "trigger" event, the true Aither way is to think of the trigger itself as a very fast envelope. Multiplying your sound by this `trigger_envelope` *is* the act of triggering. This "Everything is Audio" approach unlocks more powerful techniques like audio-rate modulation and feedback.

## Musical Patterns

These examples show how to build common musical structures by composing these rhythmic signals.

### Pattern 1: Sequencer

A sequencer uses a phasor to select gate values (`1` or `0`) from an array to create a rhythmic pattern.

```javascript
const hat_pattern = [1, 0, 1, 0, 1, 0, 1, 1]; // 1=play, 0=rest

play('sequencer', s => {
  const pulse = square((130/60) * 2, s); // 8th-note clock
  const phasor_val = phasor(pulse, s);
  
  const index = Math.floor(phasor_val * hat_pattern.length);
  const gate = hat_pattern[index];
  
  // The gate (1 or 0) determines if a trigger envelope is generated
  const trigger_env = envelope(gate * pulse, 0.01, 0.05, s);
  
  // The final sound is a noise source multiplied by the trigger envelope
  return noise(s) * trigger_env * 0.5;
});
```

### Pattern 2: Arpeggiator

An arpeggiator is a sequencer that selects notes (frequencies) from an array.

```javascript
const c_minor_scale = [60, 63, 65, 67, 70]; // MIDI notes

play('arpeggiator', s => {
  const pulse = square((130/60) * 4, s); // 16th-note clock
  const phasor_val = phasor(pulse, s);
  
  const index = Math.floor(phasor_val * c_minor_scale.length);
  const note = c_minor_scale[index];
  const freq = 440 * Math.pow(2, (note - 69) / 12);
  
  const trigger_env = envelope(pulse, 0.01, 0.3, s);
  
  return saw(freq, s) * trigger_env * 0.5;
});
```

### Pattern 3: Live Looping

A looper's actions (like recording) can be quantized by triggering them with a clock pulse.

```javascript
play('looper', s => {
  // A slow pulse that marks the start of every 4-bar measure
  const measure_pulse = square((130/60) / 16, s);
  
  // The recording trigger is an envelope generated from the measure pulse
  // AND a controller signal (e.g., from a pedal).
  const record_trigger_env = envelope(measure_pulse * s.controllers.record_button, 0.01, 0.1, s);
  
  // Record 4 bars of live audio from the microphone
  const loop_signal = looper({
    source: mic_input(s),
    recordTrigger: record_trigger_env, // The trigger is an audio signal
    lengthInBeats: 16
  }, s);
  
  return loop_signal;
});
```
> **[Learn more in the Aither Philosophy of Rhythm](docs/guides/RHYTHM_PHILOSOPHY.md)**

### Advanced Workflow: The Composer Style

For complex, multi-layered live performance, Aither supports architectural patterns like the "Composer Style," where musical ideas ("conductors") and sounds ("instruments") are defined as separate, composable blueprints.

> **[Learn this powerful pattern in the Composer Style Guide](docs/guides/COMPOSER_STYLE.md)**

---

## Documentation

-   **[The Core Philosophy](docs/PHILOSOPHY.md)**: **START HERE.** An introduction to the `f(s)` interface and the five paradigms.
-   **[The Universe State (`s`) Object](docs/STATE_OBJECT.md)**: A detailed reference for all properties of the `s` object.
-   **[The Aither Philosophy of Rhythm](docs/guides/RHYTHM_PHILOSOPHY.md)**: A deep dive into creating generative rhythm.
-   **[The Composer Style Guide](docs/guides/COMPOSER_STYLE.md)**: A guide to an advanced architectural pattern for live performance.

## License

MIT
