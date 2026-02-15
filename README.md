# Aither (αἰθήρ)

> *"One interface. Five paradigms. Infinite expression."*

**Aither** is a live coding audio synthesis engine with a unified `f(s)` interface. It is a minimalist and powerful environment for exploring sound through code, from pure mathematics to complex generative systems.

## The Core Philosophy: A Unified Interface

The entire Aither system is built on a single, elegant concept: the `f(s)` function.

```javascript
f(s) → sample
```

`s` is the "universe state," an object containing everything a signal needs to generate sound. By choosing which parts of `s` to use, different creative paradigms emerge naturally from this one interface.

> **[Full Documentation: The Universe State (`s`) Object](docs/STATE_OBJECT.md)**

## The Five Synthesis Paradigms

The five paradigms are not separate APIs; they are expressive **styles of thinking** about sound.

| Paradigm | Element | Uses | Style |
|----------|---------|------|-------|
| **Kanon** | Fire 🔥 | `s.t` | Pure time functions |
| **Rhythmos** | Earth 🌍 | `s.state`, `s.sr` | Explicit state (oscillators) |
| **Atomos** | Air 💨 | `s.state`, `s.dt` | Discrete processes (granular) |
| **Physis** | Water 💧 | `s.dt` | Physics simulation (springs) |
| **Chora** | Aither ✨ | `s.position`, `s.t` | Spatial synthesis (fields) |

All five work together seamlessly because they share the same signature. You can mix a pure Kanon LFO with a stateful Rhythmos oscillator inside the same function.

> **[Read the full Aither Philosophy](docs/PHILOSOPHY.md)**

## Quick Start

```bash
# Install dependencies
bun install

# Link globally (one-time)
bun link

# Start the server
aither start

# In another terminal, open the REPL
aither repl

# Or send a file (the recommended workflow for live coding)
aither send snippet.js
```

## Examples

### Kanon (Fire 🔥) - Pure Time

```javascript
// Pure sine wave - only uses time
play('pure', s => Math.sin(2 * Math.PI * 440 * s.t) * 0.3);
```

### Rhythmos (Earth 🌍) - Explicit State

```javascript
// Phase accumulation oscillator
play('osc', s => {
  s.state[0] = (s.state[0] + 440 / s.sr) % 1.0;
  return Math.sin(s.state[0] * 2 * Math.PI) * 0.3;
});
```

### Advanced Workflow: The Composer Style

For complex, multi-layered live performance, Aither supports architectural patterns like the "Composer Style." This is an **optional** workflow where you define musical ideas ("conductors") and sounds ("instruments") as separate blueprints and compose them together live.

```javascript
// This is just one of many ways to structure your code.
const arpeggiator = s => { /* ... returns control signals ... */ };
const bass_synth = (conductor) => s => { /* ... returns audio ... */ };

play('live-bass', bass_synth(arpeggiator));
```

## Documentation

-   **[The Core Philosophy](docs/PHILOSOPHY.md)**: **START HERE.** An introduction to the `f(s)` interface and the five paradigms.
-   **[The Universe State (`s`) Object](docs/STATE_OBJECT.md)**: A detailed reference for all properties of `s`.
-   **[The Aither Philosophy of Rhythm](docs/guides/RHYTHM_PHILOSOPHY.md)**: A deep dive into creating rhythm with signals.
-   **[The Composer Style Guide](docs/guides/COMPOSER_STYLE.md)**: A guide to an advanced architectural pattern for live performance.


## Commands & API

Aither's API is minimal and powerful.

### Core Commands
```bash
aither start              # Start audio server
aither repl               # Interactive REPL
aither send file.js       # Send file to server (recommended)
```

### Core API
```javascript
play(name, signal_fn)     // Start a signal
stop(name)                // Stop a signal
clear()                   // Stop all signals
setPosition({x, y, z})    // Set listener position
```

## Technical Specs

-   **Runtime**: Bun (fast JavaScript)
-   **Sample Rate**: 48kHz
-   **Bit Depth**: 32-bit float
-   **State Memory**: Float64Array (128 slots per signal)
-   **REPL Protocol**: UDP on port 41234

## License

MIT
