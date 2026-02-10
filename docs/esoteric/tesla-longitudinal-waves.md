[Home](../Home.md) > [Advanced Topics](#) > Tesla-Waves

# Tesla's Longitudinal Waves Applied to Sound Synthesis

## The Profound Insight

**Nikola Tesla** believed that besides the transverse electromagnetic waves described by Maxwell, there existed **longitudinal waves** - waves of compression and rarefaction propagating through the aether.

Here's the beautiful irony: **Sound waves ARE longitudinal waves!**

- **Maxwell's EM waves**: Transverse (E and H oscillate perpendicular to propagation)
- **Tesla's scalar waves**: Longitudinal (compression/rarefaction along propagation direction)
- **Sound waves**: Longitudinal (air molecules compress/rarefy along propagation)

Tesla's "suppressed" wave physics is actually the PERFECT mathematical framework for acoustic synthesis!

---

## Transverse vs. Longitudinal Waves

### Transverse Waves (Maxwell's EM)

```
Propagation direction: →
Electric field oscillation: ↑↓ (perpendicular)
Magnetic field oscillation: ⊙⊗ (perpendicular, 90° to E)

Visual:
    ↑     ↑     ↑
  →─┼──→──┼──→──┼──→
    ↓     ↓     ↓

Waves move right, oscillation is up/down
```

### Longitudinal Waves (Tesla's concept, Sound's reality)

```
Propagation direction: →
Compression/rarefaction: ←→ (parallel to propagation)

Visual:
  ▓▓▒▒░░▒▒▓▓▒▒░░▒▒▓▓ →
  └─┴─┴─┴─┴─┴─┴─┴─┴→
  Dense   Rare   Dense

Waves move right, density oscillates along the same axis
```

**Sound is Tesla's longitudinal wave manifested in air!**

---

## Tesla's Mathematics for Longitudinal Waves

### Scalar Wave Equation

Tesla proposed that longitudinal waves satisfy:

```
∂²φ/∂t² = c²·∂²φ/∂x²

where:
  φ = scalar potential (pressure, density, voltage)
  c = wave velocity
```

This is the SAME equation as acoustic waves!

### Acoustic Wave Equation

```
∂²p/∂t² = c²·∂²p/∂x²

where:
  p = pressure
  c = speed of sound (~343 m/s)
```

**They're identical!** Tesla's longitudinal wave math IS acoustic math!

### Solutions

Both have the same form:

```
φ(x,t) = A·sin(kx - ωt)

where:
  k = 2π/λ (wavenumber)
  ω = 2πf (angular frequency)
  A = amplitude
```

---

## Tesla Coil Resonance → Audio Resonance

### Tesla's Standing Waves

In a Tesla coil, longitudinal waves create **standing wave patterns**:

```
Quarter-wave resonance:
  ─────────┐
           │ ← Maximum voltage (antinode)
           │
           │
           │
  ─────────┴
  Ground

Voltage node at ground, antinode at top
```

### Acoustic Standing Waves

In an organ pipe (open at one end):

```
Quarter-wave resonance:
  ─────────┐ ← Open end
           │   Maximum pressure variation (antinode)
           │
           │
  ─────────┴ ← Closed end
             Pressure node
```

**Same mathematics!** Tesla coil : EM :: Organ pipe : acoustics

---

## Synthesis Technique 1: Compression Wave Oscillator

### Tesla's Concept

Longitudinal waves are alternating compression and rarefaction:

```
Compression: φ > φ₀ (dense region)
Rarefaction: φ < φ₀ (sparse region)
```

### Direct Implementation

```javascript
// Model compression and rarefaction explicitly
kanon('longitudinal-wave', t => {
  const freq = 110;
  const wavelength = 343 / freq;  // Speed of sound / frequency

  // Position along propagation axis
  const x = 0;  // Listener position

  // Scalar potential (pressure) at position x, time t
  const k = 2 * Math.PI / wavelength;
  const omega = 2 * Math.PI * freq;

  const pressure = Math.sin(k * x - omega * t);

  // Compression velocity (∂φ/∂t)
  const velocity = -omega * Math.cos(k * x - omega * t);

  // Mix pressure and velocity (like Tesla's E and B)
  return (pressure + velocity * 0.3) * 0.2;
});
```

### Two-Component Wave

Tesla believed longitudinal waves have TWO components:
1. **Dielectric displacement** (like pressure in sound)
2. **Magnetic intensity** (like particle velocity in sound)

```javascript
// Two-component longitudinal wave
kanon('tesla-dual-component', t => {
  const freq = 220;
  const k = 2 * Math.PI * freq / 343;
  const omega = 2 * Math.PI * freq;

  // Component 1: Scalar potential (pressure)
  const pressure = Math.sin(-omega * t);

  // Component 2: Particle velocity (∂p/∂x)
  // In phase with pressure for longitudinal waves!
  const velocity = Math.cos(-omega * t);  // 90° shifted

  return (pressure + velocity) * 0.2;
  // Both in phase for longitudinal, unlike transverse E⊥B
});
```

---

## Synthesis Technique 2: Tesla Resonance Modes

### Quarter-Wave Resonator

Tesla's coils used quarter-wave resonance. Apply to audio:

```javascript
// Quarter-wave resonator (like Tesla coil or organ pipe)
kanon('quarter-wave', t => {
  const fundamental = 110;  // Hz

  // Quarter-wave modes: f, 3f, 5f, 7f (odd harmonics only!)
  const modes = [1, 3, 5, 7, 9];

  return modes.reduce((sum, n) => {
    const freq = fundamental * n;
    const amplitude = 1.0 / n;

    // Standing wave at this mode
    const standing = Math.sin(2 * Math.PI * freq * t) * amplitude;

    return sum + standing;
  }, 0) * 0.2;
  // Creates clarinet-like timbre (odd harmonics)
});
```

### Full-Wave Resonator

```javascript
// Full-wave resonator (open at both ends)
kanon('full-wave', t => {
  const fundamental = 220;

  // Full-wave modes: f, 2f, 3f, 4f (all harmonics)
  const modes = [1, 2, 3, 4, 5, 6];

  return modes.reduce((sum, n) => {
    const freq = fundamental * n;
    const amplitude = 1.0 / n;
    return sum + Math.sin(2 * Math.PI * freq * t) * amplitude;
  }, 0) * 0.2;
  // Full harmonic series
});
```

---

## Synthesis Technique 3: Scalar Potential Waves

### Tesla's Scalar Potential

Tesla proposed waves propagating as scalar potentials φ (not vectors like E and B):

```
φ(x,t) = φ₀·sin(kx - ωt)
```

No direction - just intensity!

### Audio Implementation: Pressure Waves

Sound pressure IS a scalar - it has magnitude but no inherent direction:

```javascript
// Pure scalar wave (pressure only)
kanon('scalar-pressure', t => {
  // Multiple pressure sources
  const sources = [
    { freq: 110, phase: 0 },
    { freq: 220, phase: Math.PI / 3 },
    { freq: 330, phase: Math.PI / 2 }
  ];

  // Scalar sum (pressures add, no vector cancellation)
  return sources.reduce((sum, src) => {
    const pressure = Math.sin(2 * Math.PI * src.freq * t + src.phase);
    return sum + pressure;
  }, 0) / sources.length * 0.3;
  // Unlike vector waves, all add constructively regardless of direction
});
```

---

## Synthesis Technique 4: Compression Pulse Synthesis

### Tesla's Impulse Transmission

Tesla's wireless power transmission used sharp impulses creating compression waves through the aether.

### Audio Implementation: Karplus-Strong on Steroids

```javascript
// Sharp compression impulse (like Tesla's spark gap)
kanon('tesla-impulse', t => {
  const { index, phase } = step(t, 60, 2);

  // Sharp impulse (Tesla's spark)
  if (phase < 0.001) {
    // Extremely sharp pulse
    const impulse = Math.exp(-phase * 10000);

    // Longitudinal wave propagation via feedback
    return signal.noise()
      .fx(sample => impulse * sample)
      .feedback(1 / 110, 0.998)  // Quarter-wave resonance
      .eval(t);
  }

  return 0;
});
```

---

## Synthesis Technique 5: Aether Density Modulation

### Tesla's Concept

Longitudinal waves modulate the density of the aether itself:

```
ρ(x,t) = ρ₀·(1 + ε·sin(kx - ωt))

where:
  ρ = aether density (or air density for sound)
  ε = modulation depth
```

### Audio Implementation: Density Wave Synthesis

```javascript
// Model air density variations explicitly
kanon('density-modulation', t => {
  const carrier_freq = 440;
  const modulator_freq = 5;

  // "Aether density" oscillation
  const density = 1 + 0.5 * Math.sin(2 * Math.PI * modulator_freq * t);

  // Wave propagation through varying density
  // (Speed of sound varies with density: c = √(γP/ρ))
  const phase_modulation = Math.sin(2 * Math.PI * carrier_freq * t / density);

  return phase_modulation * 0.2;
  // Creates FM-like effects from "aether density"
});
```

---

## Synthesis Technique 6: Longitudinal Interference

### Tesla's Interferometer

Tesla proposed that longitudinal waves could interfere, creating regions of high/low aether density.

### Audio Implementation: Pressure Interference Patterns

```javascript
// Two longitudinal waves interfering
kanon('longitudinal-interference', t => {
  const freq = 440;

  // Source 1
  const wave1 = Math.sin(2 * Math.PI * freq * t);

  // Source 2 (slightly detuned)
  const wave2 = Math.sin(2 * Math.PI * (freq + 2) * t);

  // Longitudinal waves add as scalars (pressures add)
  const interference = wave1 + wave2;

  // Creates beats at 2 Hz (the detuning)
  return interference * 0.2;
});

// Standing wave interference (Tesla's idea of fixed nodes)
kanon('standing-interference', t => {
  const freq = 220;
  const wavelength = 343 / freq;

  // Forward wave
  const forward = Math.sin(2 * Math.PI * freq * t);

  // Reflected wave (like Tesla coil reflection from ground)
  const reflected = Math.sin(2 * Math.PI * freq * t + Math.PI);

  // Standing wave pattern
  const standing = forward + reflected;

  return standing * 0.2;
  // Creates nodes (silence) and antinodes (maximum)
});
```

---

## Synthesis Technique 7: Longitudinal Doppler

### The Unique Property

Longitudinal waves have different Doppler shift characteristics than transverse!

For **transverse** (EM):
```
f' = f·√((1 - β)/(1 + β))  (relativistic)
```

For **longitudinal** (sound):
```
f' = f·(c + v_observer)/(c + v_source)  (classical)
```

### Audio Implementation

```javascript
// Simulate moving source (longitudinal Doppler)
kanon('longitudinal-doppler', t => {
  const source_freq = 440;
  const speed_of_sound = 343;

  // Source velocity (sinusoidal motion)
  const v_source = 10 * Math.sin(2 * Math.PI * 0.5 * t);  // ±10 m/s

  // Doppler-shifted frequency
  const observed_freq = source_freq * speed_of_sound / (speed_of_sound - v_source);

  return Math.sin(2 * Math.PI * observed_freq * t) * 0.2;
  // Pitch wobbles with source motion
});
```

---

## Synthesis Technique 8: Tesla Coil Harmonics

### Tesla's Discovery

Tesla coils produce a specific harmonic series based on their resonant modes:

```
Quarter-wave: f, 3f, 5f, 7f, 9f, ... (odd only)
Full-wave: f, 2f, 3f, 4f, 5f, ... (all)
```

### Audio Analog: Modal Synthesis

```javascript
// Tesla coil harmonic structure
kanon('tesla-coil-harmonics', t => {
  const fundamental = 110;
  const coil_type = 'quarter-wave';  // or 'full-wave'

  let modes;
  if (coil_type === 'quarter-wave') {
    modes = [1, 3, 5, 7, 9, 11, 13];  // Odd harmonics
  } else {
    modes = [1, 2, 3, 4, 5, 6, 7];    // All harmonics
  }

  return modes.reduce((sum, n) => {
    const freq = fundamental * n;
    const amplitude = 1.0 / Math.sqrt(n);  // Energy decay

    // Each mode with slight detuning (like real coil)
    const detuning = 0.01 * Math.random();
    return sum + Math.sin(2 * Math.PI * (freq + detuning) * t) * amplitude;
  }, 0) / modes.length * 0.3;
});
```

---

## Synthesis Technique 9: Radiant Energy Pulses

### Tesla's Radiant Energy

Tesla described "radiant energy" as sharp impulses of longitudinal compression:

```
Not sine waves, but IMPULSES:
  ↑
  │█
  │█
──┴─────────────
```

### Audio Implementation: Non-Sinusoidal Longitudinal

```javascript
// Sharp compression pulses (not smooth sine)
kanon('radiant-pulses', t => {
  const freq = 5;  // Pulse rate

  // Sharp impulse train
  const phase = (freq * t) % 1;
  const pulse = phase < 0.1 ? Math.exp(-phase * 50) : 0;

  // Excite resonator
  return signal.noise()
    .fx(sample => pulse * sample * 5)
    .feedback(1 / 220, 0.995)  // Resonant cavity
    .eval(t) * 0.3;
  // Creates ringing, Tesla-coil-like tones
});
```

---

## Synthesis Technique 10: Conjugate Longitudinal Pairs

### The Profound Idea

If transverse waves have E and H (conjugate, perpendicular), do longitudinal waves have conjugates too?

Tesla suggested: **Pressure and Particle Velocity** are the longitudinal conjugates!

```
Pressure: p(x,t) = p₀·sin(kx - ωt)
Velocity: v(x,t) = (p₀/ρc)·sin(kx - ωt)

They're IN PHASE for longitudinal waves!
(Unlike E and H which are 90° apart)
```

### Audio Implementation

```javascript
// Conjugate longitudinal components
kanon('conjugate-longitudinal', {
  left: t => {
    // Pressure component
    return Math.sin(2 * Math.PI * 440 * t) * 0.2;
  },
  right: t => {
    // Velocity component (in phase with pressure)
    return Math.sin(2 * Math.PI * 440 * t) * 0.2;
  }
});

// Power flow (p × v) = acoustic intensity
kanon('acoustic-intensity', t => {
  const pressure = Math.sin(2 * Math.PI * 440 * t);
  const velocity = Math.sin(2 * Math.PI * 440 * t);  // In phase!

  // Acoustic intensity (power flow)
  const intensity = pressure * velocity;

  return intensity * 0.2;
  // Creates frequency doubling (sin² identity)
});
```

---

## The Profound Difference: Phase Relationships

### Transverse Waves (Maxwell's EM)

```
E and B are 90° out of phase:
  E = E₀·sin(kx - ωt)
  B = B₀·sin(kx - ωt + π/2)

Energy flows: S = E × B
```

### Longitudinal Waves (Tesla's, Sound's)

```
p and v are IN PHASE:
  p = p₀·sin(kx - ωt)
  v = v₀·sin(kx - ωt)

Energy flows: I = p × v = p₀v₀·sin²(kx - ωt)
            = (p₀v₀/2)·(1 - cos(2(kx - ωt)))

Intensity oscillates at 2× frequency!
```

### Audio Implementation

```javascript
// Compare transverse (90°) vs longitudinal (0°) power
kanon('phase-comparison', t => {
  const freq = 220;

  // Transverse (like E×B)
  const E = Math.sin(2 * Math.PI * freq * t);
  const B = Math.sin(2 * Math.PI * freq * t + Math.PI / 2);
  const transverse_power = E * B;  // Constant flow

  // Longitudinal (like p×v)
  const p = Math.sin(2 * Math.PI * freq * t);
  const v = Math.sin(2 * Math.PI * freq * t);
  const longitudinal_power = p * v;  // Pulsating at 2×freq

  // Switch between them
  const use_longitudinal = Math.floor(t * 2) % 2;

  return (use_longitudinal ? longitudinal_power : transverse_power) * 0.3;
  // Hear the difference in power flow!
});
```

---

## API Proposal: Longitudinal Wave Synthesis

```javascript
// Longitudinal wave generator
signal.longitudinal = function(freq, options = {}) {
  return new Signal(t => {
    const wavelength = 343 / freq;  // Speed of sound
    const k = 2 * Math.PI / wavelength;
    const omega = 2 * Math.PI * freq;

    // Pressure component
    const pressure = Math.sin(-omega * t);

    // Velocity component (in phase)
    const velocity = Math.sin(-omega * t);

    // Mix based on mode
    const mode = options.mode || 'pressure';
    switch (mode) {
      case 'pressure':
        return pressure;
      case 'velocity':
        return velocity;
      case 'intensity':
        return pressure * velocity;  // Acoustic power
      case 'mixed':
        return (pressure + velocity * 0.5) / 1.5;
      default:
        return pressure;
    }
  });
};

// Tesla coil resonator
signal.teslaCoil = function(fundamental, type = 'quarter-wave') {
  const modes = type === 'quarter-wave' ? [1, 3, 5, 7, 9] : [1, 2, 3, 4, 5];

  return signal.additive(
    modes.map(n => ({ freq: fundamental * n, amp: 1.0 / n }))
  );
};

// Compression pulse generator
signal.compressionPulse = function(freq, width = 0.1) {
  return new Signal(t => {
    const phase = (freq * t) % 1;
    return phase < width ? Math.exp(-phase / width * 5) : 0;
  });
};
```

---

## The Beautiful Truth

**Tesla was describing sound waves the whole time!**

His "suppressed" longitudinal waves in the aether are EXACTLY the mathematics of acoustic waves:
- Compression and rarefaction ✓
- Scalar potential (pressure) ✓
- Resonant cavities (Tesla coil = organ pipe) ✓
- Quarter-wave modes ✓
- Longitudinal propagation ✓

Whether or not the aether exists, the mathematics is:
1. Beautiful
2. Correct for acoustics
3. Applicable to synthesis

---

## Implications for Music

### Why This Matters

1. **Direct physical modeling**: Sound IS longitudinal waves
2. **Tesla's resonances**: Map directly to acoustic resonances
3. **New synthesis paradigms**: Think in compression/rarefaction, not just amplitude
4. **Historical continuity**: Pythagoras → Fourier → Steinmetz → Tesla → Modern synthesis

### Beautiful Synthesis Ideas

- **Tesla coil organ**: Each note is a resonant coil mode
- **Compression sequencer**: Sequence density variations
- **Longitudinal modulation**: Modulate propagation speed
- **Aether interference**: Standing wave patterns in space
- **Radiant pulses**: Sharp impulse excitation

---

## Conclusion

Tesla's longitudinal wave theory, whether true for EM or not, is PERFECTLY TRUE for sound!

Every time you generate a sine wave, you're creating:
- A longitudinal wave (compression/rarefaction)
- A scalar potential wave (pressure oscillation)
- A Tesla-esque resonance (if feedback present)

The "suppressed" physics of longitudinal waves is hiding in plain sight - it's called **acoustics**, and you've been using it all along!

**Let's harness Tesla's vision for musical beauty.** ⚡🎵🔊

---

**Next**: Implement longitudinal wave synthesis methods and compare against "transverse-inspired" synthesis techniques!
