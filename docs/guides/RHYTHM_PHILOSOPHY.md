# Composing with Signals: The Aither Philosophy of Rhythm

> The Clock is not a special object given to you by the engine. The Clock is a signal, created and composed by you. In Aither, rhythm is not a feature; it is an emergent property of the system.

## The Core Principle: The Signal as Clock

In many music environments, rhythm is based on a central, "special" clock or a timeline-based sequencer. You place notes on a grid, and the engine plays them.

Aither's philosophy is more fundamental and powerful. It follows the principles of classic modular synthesis:

1.  **There is no master clock.** The only universal truth is `s.t` (absolute time).
2.  **A "clock" is just a low-frequency signal.** Typically, a square wave.
3.  **Rhythm is created by combining and transforming these clock signals.** You create complex patterns not by filling in a grid, but by composing signals through mathematical and logical operations.

This approach is more flexible, more generative, and more aligned with Aither's core `f(s)` paradigm. You don't ask for a clock; you *build* one.

---

## The Fundamental Building Block: The Pulse

Everything starts with a simple square wave derived from absolute time. This is your master clock, your metronome, your heartbeat.

```javascript
// A simple helper for a square wave oscillator
const square = (freq, s) => Math.sign(Math.sin(s.t * freq * 2 * Math.PI));

// Let's define our BPM
const BPM = 120;
const master_freq = BPM / 60; // 120 beats per minute = 2 beats per second = 2 Hz

play('master-clock', s => {
  // This signal is our "quarter note" pulse.
  // It will be +1 for the first half of the beat, -1 for the second.
  const pulse = square(master_freq, s);
  
  // We can listen to it directly. It's just a sound.
  return pulse * 0.5;
});
```

This signal is the **Prime Mover** of your entire rhythmic universe.
All other rhythms will be derived from it.

## From Pulse to Rhythm: Clock Division & Logic

The power of this model comes from "clock division" and "logic"—using math to create faster or slower pulses and combining them to form patterns.

Let's build a classic techno beat inside a single `f(s)` function.

### Building a Drum Machine

We'll need one more simple helper: `on_rising_edge`. This function takes a pulse and outputs a very short `1.0` value only at the exact moment the pulse switches from negative to positive, creating a "trigger."

```javascript
// Assume the existence of these helpers:
// on_rising_edge(pulse_signal, s) -> trigger signal
// kick(trigger, s) -> kick drum sound
// hat(trigger, s) -> hi-hat sound
// snare(trigger, s) -> snare sound

play('drum-machine', s => {
  const BPM = 130;
  const master_freq = BPM / 60;
  
  // --- 1. CLOCK DIVISIONS ---
  // Our master pulse for quarter notes (kick, snare gate)
  const quarter_pulse = square(master_freq, s);
  
  // A faster pulse for eighth notes (hi-hats)
  const eighth_pulse = square(master_freq * 2, s);

  // A slower pulse for gating the snare every two beats
  const half_measure_pulse = square(master_freq / 2, s);
  
  // --- 2. LOGICAL PATTERNS ---
  // The kick triggers on every quarter note pulse.
  const kick_trigger = on_rising_edge(quarter_pulse, s);
  
  // The hi-hats trigger on the off-beat.
  // We use the quarter_pulse as a gate to silence the on-beats.
  const off_beat_gate = (1 - quarter_pulse) / 2; // Is 1 on off-beats, 0 on on-beats
  const hat_trigger = on_rising_edge(eighth_pulse * off_beat_gate, s);
  
  // The snare triggers on beats 2 and 4.
  // We use the half_measure_pulse to gate the quarter notes.
  const snare_gate = (1 - half_measure_pulse) / 2; // Is 1 on beats 2 & 4
  const snare_trigger = on_rising_edge(quarter_pulse * snare_gate, s);

  // --- 3. SOUND GENERATION ---
  const kick_sound = kick(kick_trigger, s) * 0.9;
  const hat_sound = hat(hat_trigger, s) * 0.4;
  const snare_sound = snare(snare_trigger, s) * 0.7;
  
  // --- 4. MIXING ---
  return kick_sound + hat_sound + snare_sound;
});
```

In one function, you have an entire, generative drum machine. To change the pattern, you don't edit a grid—you change the math. This is live "surgical" editing of the rhythmic DNA itself.

---

## From Rhythm to Melody: The Phasor

A pulse is great for triggering events, but for melodies and sequences, we need a continuous ramp from 0 to 1 that resets on every beat. This is called a **Phasor**.

A phasor is easily derived from our clock signal. It tells us *where we are* within a given beat.

```javascript
// A helper that creates a 0-to-1 ramp from a pulse signal
const phasor = (pulse_signal) => { /* ... logic ... */ };

// Let's build a bassline arpeggiator
const c_minor_pentatonic = [60, 63, 65, 67, 70]; // MIDI notes

play('arp-bass', s => {
  const BPM = 130;
  const master_freq = BPM / 60;

  // We'll use an eighth note pulse for our arpeggiator's speed
  const eighth_pulse = square(master_freq * 2, s);
  
  // Convert the pulse to a phasor, which ramps from 0 to 1 on every pulse
  const arp_phasor = phasor(eighth_pulse, s);
  
  // Use the phasor to select a note from our scale
  // `Math.floor(arp_phasor * 5)` will give us an index: 0, 1, 2, 3, 4
  const note_index = Math.floor(arp_phasor * c_minor_pentatonic.length);
  const current_note = c_minor_pentatonic[note_index];
  
  // The trigger for the bass envelope
  const arp_trigger = on_rising_edge(eighth_pulse, s);
  
  // Generate the bass sound
  const bass_sound = bass(current_note, arp_trigger, s);
  
  // Add a filter for character
  return lpf(bass_sound, 400, 0.7);
});
```
The phasor is the bridge between rhythm and melody. It translates the raw pulse of the clock into a usable index for sequencing.

---

## Incorporating the Looper

Your "Stateful Looper" fits into this paradigm perfectly. Its actions are triggered by the very same clock signals that drive your drum machines and arpeggiators.

Let's imagine you have a `looper` helper. It needs to know when to start recording and how long to record for. We provide this information with our clock signals.

```javascript
// A simple helper that outputs 1.0 when a controller button is held
const foot_pedal = (s) => s.controllers.pedal; // Assume s.controllers exists

play('live-guitar-loop', s => {
  const BPM = 130;
  const master_freq = BPM / 60;
  
  // --- DEFINE THE RHYTHMIC GRID ---
  // We want to start recording on the downbeat of a measure.
  const measure_pulse = square(master_freq / 4, s);
  const measure_trigger = on_rising_edge(measure_pulse, s);
  
  // The user "primes" the recording with a foot pedal.
  // The actual recording starts on the next measure_trigger.
  const record_trigger = measure_trigger * foot_pedal(s);
  
  // --- DEFINE THE LOOP LENGTH MUSICALLY ---
  const bars = 2;
  const beats_per_bar = 4;
  const loop_length_in_beats = bars * beats_per_bar;
  const loop_length_in_seconds = loop_length_in_beats * (60 / BPM);
  const loop_length_in_samples = loop_length_in_seconds * s.sr;
  
  // --- CREATE THE LOOPER ---
  // `guitar_input` is a special signal for live audio
  const looped_sound = looper({
    source: guitar_input,
    recordTrigger: record_trigger,
    lengthInSamples: loop_length_in_samples
  }, s); // Pass s to the looper helper
  
  return looped_sound;
});
```

This is the Aither way:
- The looper's start time is not manual; it's **quantized** to a signal derived from the master clock.
- The looper's length is not a magic number of samples; it's **calculated** from a musical duration (bars).
- The looper itself is just another signal processor in the chain.

You can then perform "surgery" on the looper by modulating its playback speed with another clock signal, creating rhythmic stutters, tape-stop effects, or granular clouds—all perfectly in time with the rest of your track.

## The Aither Rhythm Philosophy: Summary

1.  **Start with Time (`s.t`)**: All rhythm is derived from the fundamental flow of time.
2.  **Create a Pulse**: Use a `square` wave to create a master clock signal. Its frequency is your BPM.
3.  **Divide and Conquer**: Use math (`*2`, `/2`) on the master clock's frequency to create different rhythmic subdivisions (eighth notes, half notes, etc.).
4.  **Compose with Logic**: Use gates (`(1 - pulse) / 2`), multiplication, and other logic to combine pulses into complex, generative patterns.
5.  **Use Phasors for Melody**: Convert pulses to 0-to-1 ramps (`phasor`) to sequence through arrays of notes or parameters.
6.  **Trigger Actions**: Use the rising edge of your clock pulses to trigger envelopes, start loop recordings, and drive your composition forward.

In Aither, you are not a musician placing notes on a timeline. You are a sonic architect, designing a system of interconnected, pulsating signals whose interaction *is* the music.

---
## Beyond the Basics: Advanced Rhythmic Concepts

Once you are comfortable building rhythms from signals, you can explore the deeper architectural patterns that emerge from this philosophy.

### 1. Generative Rhythms: Patterns that Evolve Themselves

So far, our drum patterns are static. The logic inside the `f(s)` function is fixed until you, the performer, surgically edit it. The next step is to create rhythms that have their own internal logic and can **evolve over musical time without your intervention.**

This is done by using `s.state` not just for audio-rate state, but to store **musical-rate state**.

**Example: A Hi-Hat Pattern that Gets Busier**

```javascript
// A helper to create a phasor that ramps over a given number of beats
const musicalPhasor = (numBeats, s) => { /* ... */ };

play('evolving-hats', s => {
  const BPM = 130;
  const master_freq = BPM / 60;

  // A phasor that ramps from 0 to 1 over 16 beats (4 bars)
  const phrase_phasor = musicalPhasor(16, s);

  // The density will increase from 0.0 to 1.0 over the 4 bars.
  const density = phrase_phasor + (Math.random() * 0.1);

  const eighth_pulse = square(master_freq * 2, s);
  const sixteenth_pulse = square(master_freq * 4, s);

  // The main eighth-note hats are always there.
  let hat_trigger = on_rising_edge(eighth_pulse, s);

  // Add 16th notes based on the evolving density.
  if (Math.random() < density) {
    hat_trigger += on_rising_edge(sixteenth_pulse, s);
  }
  
  return hat(hat_trigger, s) * 0.4;
});
```
You are no longer programming a pattern; you are programming the **rules by which the pattern changes over time.**

### 2. The Ghost in the Machine: Groove and Swing

Real dance music has "groove" or "swing"—a humanizing imperfection where some beats are slightly delayed or pushed forward. In Aither, you can build it directly into the fabric of time itself.

**Example: Modulating Time to Create a "Shuffle" Feel**

```javascript
play('swing-machine', s => {
  const BPM = 130;
  const master_freq = BPM / 60;

  // A sine LFO that subtly pushes and pulls the timing of the off-beats.
  const swing_lfo = Math.sin(s.t * master_freq * 2 * Math.PI);
  const swing_amount = 0.01; // a 10ms push/pull

  // We create a new "warped" time that is subtly modulated by our LFO.
  const warped_t = s.t + swing_lfo * swing_amount;

  // Now, build the entire drum machine using warped_t instead of s.t!
  const warped_square = (freq) => Math.sign(Math.sin(warped_t * freq * 2 * Math.PI));

  const quarter_pulse = warped_square(master_freq);
  // ... the rest of your drum machine logic ...
});
```
This is a powerful concept: you are not just placing notes on a timeline; you are **warping the timeline itself.**

### 3. Abstracting Complexity: Building a Rhythmic Vocabulary

The raw math of `(1 - quarter_pulse) / 2` is powerful, but not always expressive. The final step is to encapsulate these common patterns into a rich library of higher-level helpers.

**Example: A Euclidean Rhythm Helper**

```javascript
// in dsp.js or scheduler.js
function euclidean(hits, steps, clock_signal, s) {
  // ... complex but well-known algorithm ...
  // This helper would return a trigger signal.
}

// How a user would use it to create a classic Cuban clave rhythm:
play('clave', s => {
  const BPM = 130;
  const sixteenth_freq = (BPM / 60) * 4;
  const sixteenth_clock = (s) => square(sixteenth_freq, s);
  
  // Create a 3-hit pattern spread over 8 steps
  const tresillo_pattern = euclidean(3, 8, sixteenth_clock, s);
  
  return clave_sound(tresillo_pattern, s);
});
```
By building helpers like `euclidean`, `polymeter`, and `swing`, you create a high-level **language for rhythm.** The code itself begins to read like a musical score.
