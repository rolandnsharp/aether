[Home](../Home.md) > [Synthesis Techniques](#) > Spectral-Music

# Making Beautiful Music with Spectral Processing

## Introduction

Spectral processing isn't just technical - it enables entirely new ways of creating musical beauty. By working directly with frequencies (Pythagoras's harmonics), you can sculpt sound in ways impossible in the time domain.

This document shows practical musical applications and proposes an API design for Signal.

---

## Beautiful Spectral Techniques

### 1. Spectral Freeze - Ambient Pads

**The Beauty**: Capture a moment in time and sustain it forever, like a photograph of sound.

```javascript
// Freeze a chord and sustain it
kanon('frozen-chord', t => {
  const { phase } = step(t, 60, 4);

  // Play chord briefly
  const chord = phase < 0.1
    ? signal.sin(220).mix(signal.sin(277)).mix(signal.sin(330)).eval(t)
    : 0;

  // Freeze the spectrum
  return signal.spectralFreeze(chord, {
    trigger: phase < 0.1,  // Capture during attack
    decay: 0.9999          // Very slow decay
  }).eval(t);
});

// Creates ethereal, infinite sustain pads
// Like freezing a crystal in sonic amber
```

**Musical Use**: Ambient music, drones, soundscapes

---

### 2. Spectral Filtering - Harmonic Sculpting

**The Beauty**: Remove or emphasize specific harmonics with surgical precision.

```javascript
// Keep only odd harmonics (hollow, clarinet-like)
kanon('clarinet-like', t => {
  return signal.saw(220)
    .spectralFilter(bin => bin.harmonic % 2 === 1 ? bin.magnitude : 0)
    .gain(0.2)
    .eval(t);
});

// Keep only harmonics that are prime numbers (strange, otherworldly)
kanon('prime-harmonics', t => {
  const isPrime = n => {
    for (let i = 2; i < n; i++) if (n % i === 0) return false;
    return n > 1;
  };

  return signal.square(110)
    .spectralFilter(bin => isPrime(bin.harmonic) ? bin.magnitude : 0)
    .gain(0.2)
    .eval(t);
});

// Resonant peak at golden ratio frequency
kanon('golden-resonance', t => {
  const fundamental = 220;
  const golden = 1.618033988749;
  const targetFreq = fundamental * golden;

  return signal.noise()
    .spectralFilter(bin => {
      const distance = Math.abs(bin.freq - targetFreq);
      return distance < 100 ? Math.exp(-distance / 50) : 0;
    })
    .gain(0.3)
    .eval(t);
});
```

**Musical Use**: Timbral design, synthesizer programming, spectral composition

---

### 3. Spectral Delay - Shimmer Reverb

**The Beauty**: Different frequencies decay at different rates, creating evolving textures.

```javascript
// Low frequencies sustain, highs decay quickly (natural room behavior)
kanon('spectral-reverb', t => {
  const { phase } = step(t, 90, 4);

  const impulse = phase < 0.05
    ? signal.sin(330).eval(t) * env.exp(phase, 10)
    : 0;

  return signal.spectralDelay(impulse, bin => {
    // Delay time decreases with frequency (higher = faster decay)
    const decayTime = 2.0 * Math.exp(-bin.freq / 1000);
    return { delay: decayTime, feedback: 0.8 };
  }).gain(0.3).eval(t);
});

// Shimmer effect: octave up in the reverb tail
kanon('shimmer', t => {
  const dry = signal.sin(220).gain(0.2).eval(t);

  const wet = signal.spectralDelay(dry, bin => ({
    delay: 0.5,
    feedback: 0.7,
    pitchShift: 2.0  // Octave up in feedback loop
  })).gain(0.4).eval(t);

  return dry + wet;
});
```

**Musical Use**: Reverb, delay effects, ambient textures

---

### 4. Vocoder - Voice + Synthesis

**The Beauty**: Transfer the spectral envelope of one sound onto another.

```javascript
// Classic vocoder: voice controls synthesizer spectrum
kanon('vocoded', t => {
  // Carrier: rich harmonic content (sawtooth)
  const carrier = signal.saw(110);

  // Modulator: speech/voice (would come from input)
  const modulator = signal.noise(); // Simulating voice

  return signal.vocoder(carrier, modulator, {
    bands: 16,  // Number of frequency bands
    attack: 0.01,
    release: 0.05
  }).gain(0.2).eval(t);
});

// Robot voice: pure tones + voice envelope
kanon('robot-voice', t => {
  const tones = signal.sin(200).mix(signal.sin(300)).mix(signal.sin(400));
  const voice = signal.noise(); // Simulated voice

  return signal.vocoder(tones, voice, { bands: 8 }).gain(0.3).eval(t);
});
```

**Musical Use**: Robot voices, talking synthesizers, electronic vocal effects

---

### 5. Spectral Morphing - Timbral Transitions

**The Beauty**: Smoothly transition between completely different timbres.

```javascript
// Morph from sine to sawtooth over 8 beats
kanon('morphing', t => {
  const { phase: beatPhase } = step(t, 100, 8);
  const morphAmount = beatPhase; // 0 to 1 over 8 beats

  const sine = signal.sin(220);
  const saw = signal.saw(220);

  return signal.spectralMorph(sine, saw, morphAmount)
    .gain(0.2)
    .eval(t);
});

// Morph through a sequence of timbres
kanon('timbral-sequence', t => {
  const timbres = [
    signal.sin(220),
    signal.tri(220),
    signal.square(220),
    signal.saw(220)
  ];

  const { index, phase } = step(t, 80, 4);
  const currentIdx = index % timbres.length;
  const nextIdx = (index + 1) % timbres.length;

  return signal.spectralMorph(
    timbres[currentIdx],
    timbres[nextIdx],
    phase
  ).gain(0.2).eval(t);
});
```

**Musical Use**: Evolving pads, morphing synthesis, timbral animation

---

### 6. Harmonic Shifts - Unnatural Transpositions

**The Beauty**: Shift all harmonics uniformly, creating inharmonic, bell-like sounds.

```javascript
// Shift all harmonics up by 50 Hz (not a ratio, absolute shift)
kanon('spectral-shift', t => {
  return signal.square(110)
    .spectralShift(50)  // Add 50 Hz to every harmonic
    .gain(0.2)
    .eval(t);
  // Result: 110→160, 220→270, 330→380 (not harmonic anymore!)
});

// Time-varying spectral shift (vibrato in frequency space)
kanon('spectral-vibrato', t => {
  const lfo = Math.sin(2 * Math.PI * 5 * t); // 5 Hz LFO
  const shift = lfo * 100;  // ±100 Hz

  return signal.saw(220)
    .spectralShift(shift)
    .gain(0.2)
    .eval(t);
});
```

**Musical Use**: Bell synthesis, metallic timbres, weird pitch effects

---

### 7. Spectral Blurring - Smearing Time

**The Beauty**: Randomize phases to create a shimmering, chorused effect.

```javascript
// Randomize phases (spectral blur)
kanon('phase-randomized', t => {
  return signal.saw(220)
    .spectralBlur(0.5)  // 0 = no blur, 1 = max randomization
    .gain(0.2)
    .eval(t);
  // Creates a soft, diffuse version
});

// Spectral chorus (slight frequency randomization)
kanon('spectral-chorus', t => {
  return signal.sin(440)
    .spectralSpread({
      amount: 5,      // Hz of randomization per bin
      voices: 3       // Number of detuned copies
    })
    .gain(0.2)
    .eval(t);
});
```

**Musical Use**: Chorus, ensemble effects, softening harsh timbres

---

### 8. Spectral Gate - Rhythmic Filtering

**The Beauty**: Remove frequencies below a threshold, creating rhythmic timbral changes.

```javascript
// Threshold gates spectrum based on LFO
kanon('spectral-gate', t => {
  const lfo = Math.sin(2 * Math.PI * 2 * t); // 2 Hz
  const threshold = 0.1 + lfo * 0.05;  // Varying threshold

  return signal.noise()
    .spectralGate(threshold)
    .gain(0.3)
    .eval(t);
  // Harmonics appear/disappear rhythmically
});

// Remove all but the loudest 5 harmonics
kanon('sparse-spectrum', t => {
  return signal.square(110)
    .spectralTopK(5)  // Keep only top 5 magnitude bins
    .gain(0.2)
    .eval(t);
});
```

**Musical Use**: Rhythmic timbral variation, spectral quantization

---

### 9. Spectral Reversal - Time Backwards, Frequency Forwards

**The Beauty**: Reverse the spectrum (low becomes high, high becomes low).

```javascript
// Mirror the spectrum around fundamental
kanon('spectral-mirror', t => {
  const fundamental = 220;

  return signal.saw(fundamental)
    .spectralMirror(fundamental)  // Flip spectrum around 220 Hz
    .gain(0.2)
    .eval(t);
  // Harmonics: 220, 440, 660 → 220, 110, 73.3 (sub-harmonics!)
});

// Spectral inversion (high↔low)
kanon('upside-down', t => {
  return signal.square(220)
    .spectralInvert()  // Flip entire spectrum
    .gain(0.2)
    .eval(t);
});
```

**Musical Use**: Strange inversions, sub-harmonic generation, alien timbres

---

### 10. Cross-Synthesis - Hybrid Timbres

**The Beauty**: Combine spectral properties of two different signals.

```javascript
// Magnitude from A, phase from B
kanon('hybrid', t => {
  const melodic = signal.sin(440);     // Clear pitch
  const noisy = signal.noise();        // Rich texture

  return signal.crossSynth(melodic, noisy, {
    magnitudeFrom: 'melodic',  // Pitch from sine
    phaseFrom: 'noisy'         // Texture from noise
  }).gain(0.2).eval(t);
  // Result: pitched noise at 440 Hz
});

// Frequency from A, magnitude envelope from B
kanon('vocoder-style', t => {
  const carrier = signal.square(110);  // Harmonic structure
  const envelope = signal.sin(5);      // Slow modulation

  return signal.crossSynth(carrier, envelope, {
    mode: 'vocoder'
  }).gain(0.2).eval(t);
});
```

**Musical Use**: Cross-synthesis, vocoding, hybrid instruments

---

## Proposed API Design

### Core Philosophy

1. **Chainable**: Fits Signal's existing `.method()` style
2. **Functional**: Pure transformations, no hidden state
3. **Composable**: Combine spectral operations
4. **Intuitive**: Musical thinking, not DSP jargon

### Basic Spectral Operations

```javascript
// Analysis/Synthesis (automatic behind the scenes)
signal.sin(440)
  .spectral(spectrum => {
    // Manipulate spectrum directly
    return spectrum.map(bin => ({
      ...bin,
      magnitude: bin.magnitude * 0.5
    }));
  })
  .gain(0.2);

// Predefined spectral effects
signal.saw(220)
  .spectralFilter(bin => bin.freq > 1000 ? 0 : bin.magnitude)
  .spectralFreeze({ trigger: condition, decay: 0.999 })
  .spectralShift(50)
  .gain(0.2);
```

### Filter-Style Methods

```javascript
// Keep specific harmonics
signal.square(110)
  .harmonics([1, 3, 5, 7])  // Odd harmonics only
  .gain(0.2);

// Spectral EQ
signal.noise()
  .spectralEQ([
    { freq: 100, gain: -10 },   // Cut bass
    { freq: 1000, gain: 5 },    // Boost mids
    { freq: 8000, gain: -5 }    // Cut highs
  ])
  .gain(0.2);

// Formant filtering (vowel sounds)
signal.saw(110)
  .formant('a')  // "ah" vowel
  .gain(0.2);

signal.square(220)
  .formantMorph('a', 'i', morphAmount)  // ah → ee
  .gain(0.2);
```

### Time-Varying Spectral Processing

```javascript
// Process spectrum as function of time
signal.sin(220)
  .spectral((spectrum, t) => {
    const lfo = Math.sin(2 * Math.PI * 2 * t);
    return spectrum.map(bin => ({
      ...bin,
      magnitude: bin.magnitude * (0.5 + 0.5 * lfo)
    }));
  })
  .gain(0.2);

// Spectral LFO
signal.saw(110)
  .spectralModulate(
    lfoFreq: 5,
    amount: 0.5,
    target: 'magnitude'  // or 'phase', 'frequency'
  )
  .gain(0.2);
```

### Cross-Synthesis

```javascript
// Vocoder
const carrier = signal.square(110);
const modulator = signal.noise();

kanon('vocoded')
  .vocoder(carrier, modulator, { bands: 16 })
  .gain(0.2);

// Generic cross-synthesis
signal.crossSynth(
  signalA,
  signalB,
  { magnitudeFrom: 'a', phaseFrom: 'b' }
);
```

### Advanced: Manual Spectrum Control

```javascript
// Build spectrum from scratch (additive synthesis)
signal.spectrum([
  { freq: 220, mag: 1.0, phase: 0 },
  { freq: 440, mag: 0.5, phase: 0 },
  { freq: 660, mag: 0.33, phase: Math.PI }
]).gain(0.2);

// Time-varying additive
signal.spectrum(t => [
  { freq: 220, mag: 1.0, phase: 0 },
  { freq: 440, mag: 0.5 * Math.exp(-t), phase: 0 },
  { freq: 660, mag: 0.33 * Math.exp(-t * 2), phase: 0 }
]).gain(0.2);
```

### Convolution

```javascript
// FFT-based convolution
const impulse = loadImpulseResponse('cathedral.wav');

signal.sin(440)
  .convolve(impulse)
  .gain(0.2);

// Spectral multiply (equivalent to convolution)
signal.sin(440)
  .spectralMultiply(filterSpectrum)
  .gain(0.2);
```

---

## Implementation Strategy

### Phase 1: Basic FFT/IFFT

```javascript
// Internal utilities (not exposed directly)
const fft = require('./fft');  // FFT library

Signal.prototype.spectral = function(transformFn) {
  return new Signal(t => {
    // 1. Buffer recent samples
    const buffer = this.getRecentSamples(t, fftSize);

    // 2. FFT
    const spectrum = fft(buffer);

    // 3. Transform
    const processed = transformFn(spectrum, t);

    // 4. IFFT
    const output = ifft(processed);

    // 5. Return current sample (with overlap-add)
    return output[currentIndex];
  });
};
```

### Phase 2: Common Effects

```javascript
// Built on top of .spectral()
Signal.prototype.spectralFilter = function(filterFn) {
  return this.spectral(spectrum =>
    spectrum.map(bin => ({
      ...bin,
      magnitude: filterFn(bin)
    }))
  );
};

Signal.prototype.spectralFreeze = function(options) {
  let frozen = null;

  return this.spectral((spectrum, t) => {
    if (options.trigger(t) && !frozen) {
      frozen = spectrum.clone();
    }

    if (frozen) {
      // Decay frozen spectrum
      frozen = frozen.map(bin => ({
        ...bin,
        magnitude: bin.magnitude * options.decay
      }));
      return frozen;
    }

    return spectrum;
  });
};
```

### Phase 3: Cross-Synthesis

```javascript
Signal.prototype.vocoder = function(modulator, options) {
  return this.spectral((carrierSpectrum, t) => {
    const modulatorSpectrum = modulator.getSpectrum(t);

    // Multiply magnitudes, keep carrier phase
    return carrierSpectrum.map((bin, k) => ({
      ...bin,
      magnitude: bin.magnitude * modulatorSpectrum[k].magnitude
    }));
  });
};
```

---

## Musical Examples

### Example 1: Spectral Drone Machine

```javascript
const Y = makeRecursive => {
  const wrapper = recursiveFunc => makeRecursive(
    (...args) => recursiveFunc(recursiveFunc)(...args)
  );
  return wrapper(wrapper);
};

// Generate evolving spectral content
const spectralDrone = Y(recurse => depth => {
  if (depth === 0) return signal.sin(220);

  const lower = recurse(depth - 1);
  return lower.spectral(spectrum =>
    spectrum.map(bin => ({
      ...bin,
      magnitude: bin.magnitude * (1 + Math.random() * 0.1)
    }))
  );
});

kanon('drone', spectralDrone(5).gain(0.2).fn);
```

### Example 2: Harmonic Arpeggiator

```javascript
kanon('harmonic-arp', t => {
  const { index, phase } = step(t, 120, 16);

  const harmonics = [1, 2, 3, 4, 5, 6, 8, 10];
  const activeHarmonic = harmonics[index % harmonics.length];

  return signal.saw(110)
    .spectralFilter(bin =>
      bin.harmonic === activeHarmonic ? bin.magnitude : 0
    )
    .gain(0.3)
    .eval(t);
});
```

### Example 3: Golden Ratio Resonator

```javascript
const phi = 1.618033988749;

kanon('golden-resonance', t => {
  const { phase } = step(t, 80, 4);

  // Impulse
  const impulse = phase < 0.01 ? 1 : 0;

  return signal.noise()
    .spectralFilter(bin => {
      // Emphasize frequencies at golden ratio multiples
      const fundamental = 110;
      let resonance = 0;

      for (let n = 1; n <= 10; n++) {
        const targetFreq = fundamental * Math.pow(phi, n);
        const distance = Math.abs(bin.freq - targetFreq);
        resonance += Math.exp(-distance / 20);
      }

      return bin.magnitude * resonance;
    })
    .gain(0.4)
    .eval(t);
});
```

---

## The Beauty of Spectral Processing

### Why It's Profound

1. **Direct harmonic control**: Pythagoras's ratios are explicit
2. **Impossible time-domain operations**: Can't easily filter individual harmonics in time
3. **Surgical precision**: Manipulate single frequencies
4. **Natural thinking**: Musicians think in terms of pitch/timbre (frequency domain)
5. **Generative potential**: Combine with Y-combinator for recursive spectral evolution

### Connection to Signal's Philosophy

```javascript
// Time domain: Sample → Sample
kanon(t => Math.sin(2 * Math.PI * 440 * t))

// Frequency domain: Spectrum → Spectrum
signal.spectral(spectrum => spectrum.map(process))

// Both are pure functional transformations!
// FFT is just another λ-calculus operation
```

---

## Reminder: EM Fields and Music

**TO EXPLORE LATER:**

Both electromagnetic waves and sound waves satisfy wave equations:

**Maxwell's Equations** (EM):
```
∇·E = ρ/ε₀
∇·B = 0
∇×E = -∂B/∂t
∇×B = μ₀J + μ₀ε₀∂E/∂t
```

**Wave Equation** (Sound):
```
∂²p/∂t² = c²∇²p
```

Both lead to:
```
∂²ψ/∂t² = c²∂²ψ/∂x²
```

Light and sound are both oscillations - same math, different medium!

**Connections to explore:**
- Interference patterns (music = constructive/destructive)
- Polarization ↔ Phase
- Diffraction ↔ Acoustic diffraction
- Standing waves in both domains
- Resonance = same physics

---

## Next Steps

1. Implement basic FFT/IFFT
2. Add `.spectral()` method
3. Build common effects on top
4. Create musical examples
5. Document the profound connections

The beauty awaits in the spectrum! 🎵
