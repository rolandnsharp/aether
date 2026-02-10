# Modulation Techniques (AM, FM, PM, RM)

> *"Modulation is the art of making one signal affect another."*

## Introduction

Modulation creates complex, evolving timbres by using one signal (the **modulator**) to control a parameter of another signal (the **carrier**).

---

## Amplitude Modulation (AM)

Multiply the carrier amplitude by the modulator.

### Tremolo (Slow AM)

```javascript
import { Kanon } from './src/arche/kanon/index.js';

const tremolo = t => {
  const carrier = Math.sin(2 * Math.PI * 440 * t);
  const modulator = Math.sin(2 * Math.PI * 5 * t);  // 5 Hz LFO

  // Scale modulator to 0.5 - 1.0 range
  const am = carrier * (0.5 + 0.5 * modulator);

  return am * 0.3;
};

Kanon.register('tremolo', tremolo);
```

**Result**: Rhythmic volume oscillation.

### Ring Modulation (Fast AM)

```javascript
const ringMod = t => {
  const carrier = Math.sin(2 * Math.PI * 440 * t);
  const modulator = Math.sin(2 * Math.PI * 220 * t);

  // Unscaled multiplication
  return carrier * modulator * 0.3;
};

Kanon.register('ring-mod', ringMod);
```

**Result**: Creates sum and difference frequencies:
- `f_carrier + f_mod = 440 + 220 = 660 Hz`
- `f_carrier - f_mod = 440 - 220 = 220 Hz`

### AM Sidebands

When `f_mod` is in audio range, AM creates sidebands:

```
f_carrier ± f_mod
```

```javascript
const amSidebands = t => {
  const carrier = Math.sin(2 * Math.PI * 440 * t);
  const modulator = Math.sin(2 * Math.PI * 100 * t);

  return carrier * (0.5 + 0.5 * modulator) * 0.3;
};

// Produces: 440 Hz (carrier), 340 Hz, 540 Hz (sidebands)
```

### Using the AM Helper

```javascript
const carrier = t => Math.sin(2 * Math.PI * 440 * t);
const modulator = t => Math.sin(2 * Math.PI * 5 * t);

Kanon.register('tremolo',
  Kanon.pipe(
    Kanon.am(modulator, carrier),
    Kanon.gain(0.3)
  )
);
```

---

## Frequency Modulation (FM)

Modulate the instantaneous frequency of the carrier.

### Simple Vibrato

For slow FM (vibrato), you can derive the phase analytically:

```javascript
const vibrato = t => {
  const carrierFreq = 440;
  const vibratoRate = 5;     // Hz
  const vibratoDepth = 10;   // Hz

  // Phase = integral of frequency
  // freq(t) = 440 + 10·sin(2π·5·t)
  // phase(t) = 440t - (10/(2π·5))·cos(2π·5·t)

  const phase = carrierFreq * t
    - (vibratoDepth / (2 * Math.PI * vibratoRate))
      * Math.cos(2 * Math.PI * vibratoRate * t);

  return Math.sin(2 * Math.PI * phase) * 0.3;
};

Kanon.register('vibrato', vibrato);
```

### Classic FM Synthesis

For audio-rate FM, phase modulation is easier:

```javascript
const fmSynth = t => {
  const carrierFreq = 440;
  const modFreq = 220;
  const modIndex = 5;  // Modulation depth

  const modulator = Math.sin(2 * Math.PI * modFreq * t) * modIndex;
  const carrier = Math.sin(2 * Math.PI * carrierFreq * t + modulator);

  return carrier * 0.3;
};

Kanon.register('fm-basic', fmSynth);
```

### FM Sidebands

FM creates sidebands at `f_carrier ± n·f_mod`:

```
f_carrier, f_carrier ± f_mod, f_carrier ± 2·f_mod, ...
```

The **modulation index** controls how many sidebands are audible:

```javascript
const fmSidebands = (carrierFreq, modFreq, modIndex) => t => {
  const modulator = Math.sin(2 * Math.PI * modFreq * t) * modIndex;
  const carrier = Math.sin(2 * Math.PI * carrierFreq * t + modulator);
  return carrier * 0.3;
};

// Example: C:M ratio of 1:1 (harmonic)
Kanon.register('fm-harmonic', fmSidebands(440, 440, 3));

// Example: C:M ratio of 1:1.5 (inharmonic)
Kanon.register('fm-bell', fmSidebands(440, 660, 5));
```

### DX7-Style FM (Multiple Operators)

```javascript
const dx7Algorithm = t => {
  // Algorithm 1: 6 operators in cascade

  // Op 6 (bottom of stack)
  const op6 = Math.sin(2 * Math.PI * 55 * t);

  // Op 5 modulates Op 6
  const op5 = Math.sin(2 * Math.PI * 110 * t + op6 * 2);

  // Op 4 modulates Op 5
  const op4 = Math.sin(2 * Math.PI * 220 * t + op5 * 1.5);

  // Op 3 modulates Op 4
  const op3 = Math.sin(2 * Math.PI * 440 * t + op4 * 1);

  // Op 2 modulates Op 3
  const op2 = Math.sin(2 * Math.PI * 880 * t + op3 * 0.5);

  // Op 1 is the carrier
  const op1 = Math.sin(2 * Math.PI * 1760 * t + op2 * 0.25);

  return op1 * 0.2;
};

Kanon.register('dx7-cascade', dx7Algorithm);
```

### Using the FM Helper

```javascript
const depth = 5;
const modulator = t => Math.sin(2 * Math.PI * 220 * t);
const carrier = t => Math.sin(2 * Math.PI * 440 * t);

Kanon.register('fm',
  Kanon.fm(depth, modulator, carrier)
);
```

---

## Phase Modulation (PM)

Similar to FM, but modulates phase directly instead of frequency:

```javascript
const phaseMod = t => {
  const carrierFreq = 440;
  const modFreq = 5;
  const modIndex = 2;

  const modulator = Math.sin(2 * Math.PI * modFreq * t) * modIndex;
  const carrier = Math.sin(2 * Math.PI * carrierFreq * t + modulator);

  return carrier * 0.3;
};

Kanon.register('phase-mod', phaseMod);
```

**Note**: PM and FM are mathematically equivalent, but PM is easier to implement in pure `f(t)` style.

---

## Ring Modulation (RM)

Unipolar multiplication creating sum and difference frequencies:

```javascript
const ring = t => {
  const carrier = Math.sin(2 * Math.PI * 440 * t);
  const modulator = Math.sin(2 * Math.PI * 220 * t);

  // Ring mod = simple multiplication
  return carrier * modulator * 0.4;
};

Kanon.register('ring', ring);
```

**Produces**:
- Sum: 440 + 220 = 660 Hz
- Difference: 440 - 220 = 220 Hz
- (Original frequencies disappear!)

### Inharmonic Ring Mod

Use non-integer ratios for metallic/bell timbres:

```javascript
const bellRing = t => {
  const carrier = Math.sin(2 * Math.PI * 440 * t);
  const modulator = Math.sin(2 * Math.PI * 666 * t);  // 1.514:1 ratio

  return carrier * modulator * 0.4;
};

Kanon.register('bell-ring', bellRing);
```

---

## Cross-Modulation

Two oscillators modulating each other:

```javascript
const crossMod = t => {
  const freq1 = 440;
  const freq2 = 550;
  const depth = 2;

  // Each modulates the other
  const osc1 = Math.sin(2 * Math.PI * freq1 * t);
  const osc2 = Math.sin(2 * Math.PI * freq2 * t);

  const out1 = Math.sin(2 * Math.PI * freq1 * t + osc2 * depth);
  const out2 = Math.sin(2 * Math.PI * freq2 * t + osc1 * depth);

  return (out1 + out2) * 0.2;
};

Kanon.register('cross-mod', crossMod);
```

**Result**: Complex, evolving timbres.

---

## Through-Zero FM

Frequency goes negative, creating unique sounds:

```javascript
const throughZeroFM = t => {
  const carrierFreq = 440;
  const modFreq = 5;
  const modDepth = 500;  // Can exceed carrier frequency!

  // Frequency can go negative
  const instantFreq = carrierFreq + Math.sin(2 * Math.PI * modFreq * t) * modDepth;

  // Integrate frequency to get phase
  // (Simplified - in practice needs memoization)
  const phase = carrierFreq * t;  // Approximation

  return Math.sin(2 * Math.PI * phase) * 0.3;
};

Kanon.register('through-zero', throughZeroFM);
```

---

## Waveshaping as Modulation

Use one signal to distort another:

```javascript
const waveshaper = t => {
  const carrier = Math.sin(2 * Math.PI * 440 * t);
  const modulator = Math.sin(2 * Math.PI * 3 * t);  // Slow LFO

  // Modulator controls distortion amount
  const drive = 1 + modulator * 5;  // 0-6 range

  // Waveshape
  const shaped = Math.tanh(carrier * drive);

  return shaped * 0.3;
};

Kanon.register('dynamic-distortion', waveshaper);
```

---

## Pulse Width Modulation (PWM)

Modulate the duty cycle of a square wave:

```javascript
const pwm = t => {
  const freq = 110;
  const modRate = 0.5;

  // Modulate pulse width (0.1 to 0.9)
  const pulseWidth = 0.5 + 0.4 * Math.sin(2 * Math.PI * modRate * t);

  // Square wave with variable pulse width
  const phase = (freq * t) % 1;
  const pulse = phase < pulseWidth ? 1 : -1;

  return pulse * 0.3;
};

Kanon.register('pwm', pwm);
```

**Result**: Evolving harmonic content.

---

## Vector Synthesis

Blend between multiple oscillators dynamically:

```javascript
const vectorSynth = t => {
  const osc1 = Math.sin(2 * Math.PI * 220 * t);
  const osc2 = Math.sin(2 * Math.PI * 440 * t);
  const osc3 = Math.sin(2 * Math.PI * 660 * t);
  const osc4 = Math.sin(2 * Math.PI * 880 * t);

  // LFOs control blend
  const lfo1 = (Math.sin(2 * Math.PI * 0.2 * t) + 1) / 2;  // 0-1
  const lfo2 = (Math.sin(2 * Math.PI * 0.3 * t) + 1) / 2;

  // Mix based on position in 2D "vector space"
  const mix = osc1 * (1 - lfo1) * (1 - lfo2) +
              osc2 * lfo1 * (1 - lfo2) +
              osc3 * (1 - lfo1) * lfo2 +
              osc4 * lfo1 * lfo2;

  return mix * 0.3;
};

Kanon.register('vector', vectorSynth);
```

---

## Granular Time-Stretching

Modulate grain playback rate:

```javascript
const granular = t => {
  const grainRate = 50;  // Grains per second
  const grainDur = 0.05;  // 50ms grains

  const grainIndex = Math.floor(t * grainRate);
  const grainPhase = (t * grainRate) % 1;

  // Modulate playback speed per grain
  const speedMod = 1 + Math.sin(grainIndex * 0.1) * 0.2;  // 0.8-1.2

  // Envelope
  const env = Math.sin(Math.PI * grainPhase);

  // Content (modulated playback)
  const content = Math.sin(2 * Math.PI * 440 * t * speedMod);

  return content * env * 0.3;
};

Kanon.register('granular-stretch', granular);
```

---

## LFO Shapes

Different LFO waveforms create different modulation characters:

```javascript
// Sine LFO (smooth)
const sineLFO = t => Math.sin(2 * Math.PI * freq * t);

// Triangle LFO (linear)
const triLFO = t => {
  const phase = (freq * t) % 1;
  return phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4;
};

// Square LFO (stepped)
const squareLFO = t => {
  const phase = (freq * t) % 1;
  return phase < 0.5 ? 1 : -1;
};

// Sawtooth LFO (ramp)
const sawLFO = t => {
  const phase = (freq * t) % 1;
  return phase * 2 - 1;
};

// Random LFO (sample & hold)
const randomLFO = t => {
  const sampleRate = 10;  // Samples per second
  const index = Math.floor(t * sampleRate);
  // Deterministic random based on index
  return (Math.sin(index * 1234.5678) * 2 - 1);
};
```

---

## Modulation Matrix

Create complex routings:

```javascript
const modulationMatrix = t => {
  // Sources
  const lfo1 = Math.sin(2 * Math.PI * 0.5 * t);
  const lfo2 = Math.sin(2 * Math.PI * 0.3 * t);
  const env = Math.exp(-t * 2);

  // Destinations
  const carrierFreq = 440 + lfo1 * 50 + env * 200;  // Pitch
  const modIndex = 2 + lfo2 * 3;                     // FM depth
  const amplitude = 0.5 + lfo1 * 0.3;                // Volume

  // FM synthesis
  const modulator = Math.sin(2 * Math.PI * 220 * t) * modIndex;
  const carrier = Math.sin(2 * Math.PI * carrierFreq * t + modulator);

  return carrier * amplitude * 0.3;
};

Kanon.register('mod-matrix', modulationMatrix);
```

---

## Further Reading

- [Additive Synthesis](additive-synthesis.md) - Building blocks
- [Delay & Feedback](delay-and-feedback.md) - Time-based effects
- [Steinmetz Conjugate Synthesis](../esoteric/steinmetz-conjugate-synthesis.md) - Complex modulation
- [Tesla Longitudinal Waves](../esoteric/tesla-longitudinal-waves.md) - Wave physics

---

**Next**: [Envelopes](envelopes.md) | [Filters](filters.md)
