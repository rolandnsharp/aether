# The Composer Style: An Advanced Architecture for Live Performance

> This guide documents the "Composer Style," an **optional but powerful** architectural pattern for structuring your Aither code. It is designed to help manage the complexity of multi-layered compositions and is particularly effective for live improvisation.

## When Should I Use This Pattern?

The Composer Style is not the only way to make music in Aither. For many situations, like creating drones, generative patches, or simple drum machines, a single `play()` command with a monolithic `f(s)` function is more direct and perfectly valid.

You should consider using the Composer Style when your performance involves:

-   **Multiple independent layers** (e.g., a bassline, a lead, and a drum beat).
-   The need to **decouple musical logic from sound design** (i.e., changing the melody without changing the synth sound, and vice-versa).
-   **One-to-many control**, where a single rhythmic or melodic idea drives several different instruments.

## The Core Philosophy: Stateless Blueprints

The Composer Style is built on a simple idea: you first define all your musical and sonic ideas as **stateless blueprints**. These are pure functions that are not yet running, representing the DNA of your music.

1.  **Conductors (The "Brain"):** A Conductor is a function that generates a stream of musical ideas. It takes `s` and returns a stream of control signals (like pitch and gate, represented as pure audio). It produces no sound itself.
2.  **Instruments (The "Voice"):** An Instrument is a higher-order function that defines a sound. It takes a Conductor as an argument and returns a complete, audible `f(s)` signal.

These blueprints are the vocabulary of your performance, ready to be composed in your editor.

### Functional Composition vs. Analog Synthesis

The Composer Style is spiritually similar to patching an analog modular synthesizer, but with a crucial difference that makes it uniquely powerful in software.

*   An **analog synth** uses **Dataflow**: You connect stateful modules with patch cables, creating a runtime graph.
*   **Aither** uses **Functional Composition**: You connect stateless blueprints with function arguments. This composes them into a **single, new `f(s)` function** *before* the engine runs it.

The result is a monolithic signal that is ideal for optimization by modern JIT compilers, eliminating the overhead of a dataflow graph while maintaining the intuitive mental model of patching. The line `instrument(conductor)` *is* the patch cable.

---

## The Live Coding Workflow: "Edit the Blueprint, Re-Compose the World"

This workflow turns your code editor into a powerful performance interface.

### Step 1: Define Your Blueprints

In your editor, create your palette of musical and sonic ideas.

```javascript
// --- Blueprint for a Conductor (Musical Idea) ---
const c_minor_arpeggiator = s => {
  const eighth_pulse = square((130 / 60) * 2, s);
  const phasor_val = phasor(eighth_pulse, s);
  // ... logic to calculate note and gate ...
  const note_cv = (note - 60) / 12;
  const gate_cv = on_rising_edge(eighth_pulse, s);
  return { note_cv, gate_cv };
};

// --- Blueprint for an Instrument (Sonic Idea) ---
const bass_instrument = (conductor) => {
  return s => {
    const { note_cv, gate_cv } = conductor(s);
    const freq = 440 * Math.pow(2, note_cv);
    const amp_env = envelope(gate_cv, 0.01, 0.5, s);
    return saw(freq, s) * amp_env * 0.7;
  };
};
```

### Step 2: Compose and Play

In a dedicated "composition block" in your file, connect the blueprints and send them to the REPL (`Ctrl+Enter`).

```javascript
// --- Composition Block ---
const bass_voice = bass_instrument(c_minor_arpeggiator);
play('bass-voice', bass_voice);
```
The music starts. To perform, you edit the blueprints and then resend this composition block to hot-swap the live signal.

### Advanced Pattern: One-to-Many Control

This is where the Composer Style truly shines. You can use the same Conductor to drive multiple, different Instruments.

```javascript
// --- Composition Block ---
const bass_voice = bass_instrument(c_minor_arpeggiator);
const lead_voice = lead_instrument(c_minor_arpeggiator); // Using the same brain!

play('bass-voice', bass_voice);
play('lead-voice', lead_voice);
```
Now, if you edit `c_minor_arpeggiator` and re-send this block, **both instruments will change their melody simultaneously.**

## Why Use the Composer Style?

*   **Purity and Elegance:** It requires **zero changes to the Aither engine.** It uses only the core features: `f(s)`, `play`, and functional composition.
*   **Decoupling:** It cleanly separates musical logic (conductors) from sound design (instruments) for a fast and flexible performance workflow.
*   **Clarity:** The dependencies are explicit. The line `bass_instrument(c_minor_arpeggiator)` is the "patch cable," clear and readable.
*   **Scalability:** It is a robust way to manage the complexity of a full performance, turning your editor into a true musical instrument.
